<?php

declare(strict_types=1);

namespace NeneContact\Http;

use LogicException;
use Nene2\Auth\GuardedJwtSecretResolver;
use Nene2\Auth\LocalBearerTokenVerifier;
use Nene2\Auth\TokenIssuerInterface;
use Nene2\Auth\TokenVerifierInterface;
use Nene2\Config\AppConfig;
use Nene2\Config\ConfigLoader;
use Nene2\Database\DatabaseConnectionFactoryInterface;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\DatabaseTransactionManagerInterface;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use Nene2\Database\PdoDatabaseTransactionManager;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\DomainExceptionHandlerInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use Nene2\Http\ResponseEmitter;
use Nene2\Http\RuntimeApplicationFactory;
use Nene2\Http\UtcClock;
use Nene2\Log\MonologLoggerFactory;
use Nene2\Log\RequestIdHolder;
use NeneContact\ApplicationServiceProvider;
use NeneContact\Auth\AdminApiAuthMiddleware;
use NeneContact\Auth\CapabilityMiddleware;
use NeneContact\Organization\OrganizationRepositoryInterface;
use NeneContact\Organization\Resolution\CustomDomainResolutionStrategy;
use NeneContact\Organization\Resolution\EnvResolutionStrategy;
use NeneContact\Organization\Resolution\OrgResolverMiddleware;
use NeneContact\Organization\Resolution\PathPrefixResolutionStrategy;
use NeneContact\Organization\Resolution\SubdomainResolutionStrategy;
use NeneContact\RateLimit\PublicSubmitThrottleMiddleware;
use NeneContact\Submission\PublicFormReaderInterface;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mailer\Transport;

/**
 * Wires the NeNe Contact HTTP runtime on top of NENE2. Kept deliberately small:
 * domain wiring (organization, auth, contact forms, submissions) is added through
 * focused service providers registered in {@see ApplicationServiceProvider}.
 */
final readonly class RuntimeServiceProvider implements ServiceProviderInterface
{
    public const PROJECT_ROOT = 'nene-contact.project_root';

    /**
     * Development-only fallback secret, used **only** in local/test when
     * NENE2_LOCAL_JWT_SECRET is unset and the operator opted in via
     * NENE2_ALLOW_DEV_SECRET — see {@see GuardedJwtSecretResolver}. This value is
     * not secret, so signing real tokens with it would be a full authentication
     * bypass.
     */
    private const DEFAULT_DEV_SECRET = 'nene-contact-dev-secret';

    public function register(ContainerBuilder $builder): void
    {
        $builder->addProvider(new ApplicationServiceProvider());

        $builder
            // Single time source for the runtime. Default UtcClock keeps production
            // behaviour identical to raw time(); tests bind a fixed clock for determinism.
            ->set(ClockInterface::class, static fn (ContainerInterface $container): ClockInterface => new UtcClock())
            ->set(
                ConfigLoader::class,
                static function (ContainerInterface $container): ConfigLoader {
                    $projectRoot = $container->get(self::PROJECT_ROOT);

                    if (!is_string($projectRoot) || $projectRoot === '') {
                        throw new LogicException('Project root service is invalid.');
                    }

                    return new ConfigLoader($projectRoot);
                },
            )
            ->set(
                AppConfig::class,
                static function (ContainerInterface $container): AppConfig {
                    $loader = $container->get(ConfigLoader::class);

                    if (!$loader instanceof ConfigLoader) {
                        throw new LogicException('Config loader service is invalid.');
                    }

                    return $loader->load();
                },
            )
            ->set(
                DatabaseConnectionFactoryInterface::class,
                static function (ContainerInterface $container): DatabaseConnectionFactoryInterface {
                    $config = $container->get(AppConfig::class);

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    return new PdoConnectionFactory($config->database);
                },
            )
            ->set(
                DatabaseQueryExecutorInterface::class,
                static function (ContainerInterface $container): DatabaseQueryExecutorInterface {
                    $connectionFactory = $container->get(DatabaseConnectionFactoryInterface::class);

                    if (!$connectionFactory instanceof DatabaseConnectionFactoryInterface) {
                        throw new LogicException('Database connection factory service is invalid.');
                    }

                    return new PdoDatabaseQueryExecutor($connectionFactory);
                },
            )
            ->set(
                DatabaseTransactionManagerInterface::class,
                static function (ContainerInterface $container): DatabaseTransactionManagerInterface {
                    $connectionFactory = $container->get(DatabaseConnectionFactoryInterface::class);

                    if (!$connectionFactory instanceof DatabaseConnectionFactoryInterface) {
                        throw new LogicException('Database connection factory service is invalid.');
                    }

                    return new PdoDatabaseTransactionManager($connectionFactory);
                },
            )
            ->set(Psr17Factory::class, static fn (ContainerInterface $container): Psr17Factory => new Psr17Factory())
            ->set(
                JsonResponseFactory::class,
                static function (ContainerInterface $container): JsonResponseFactory {
                    $responseFactory = $container->get(ResponseFactoryInterface::class);
                    $streamFactory = $container->get(StreamFactoryInterface::class);

                    if (!$responseFactory instanceof ResponseFactoryInterface) {
                        throw new LogicException('Response factory service is invalid.');
                    }

                    if (!$streamFactory instanceof StreamFactoryInterface) {
                        throw new LogicException('Stream factory service is invalid.');
                    }

                    return new JsonResponseFactory($responseFactory, $streamFactory);
                },
            )
            ->set(
                ProblemDetailsResponseFactory::class,
                static function (ContainerInterface $container): ProblemDetailsResponseFactory {
                    $responseFactory = $container->get(ResponseFactoryInterface::class);
                    $streamFactory = $container->get(StreamFactoryInterface::class);
                    $config = $container->get(AppConfig::class);

                    if (!$responseFactory instanceof ResponseFactoryInterface) {
                        throw new LogicException('Response factory service is invalid.');
                    }

                    if (!$streamFactory instanceof StreamFactoryInterface) {
                        throw new LogicException('Stream factory service is invalid.');
                    }

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    return new ProblemDetailsResponseFactory($responseFactory, $streamFactory, $config->problemDetailsBaseUrl);
                },
            )
            ->set(
                ResponseFactoryInterface::class,
                static function (ContainerInterface $container): ResponseFactoryInterface {
                    $factory = $container->get(Psr17Factory::class);

                    if (!$factory instanceof ResponseFactoryInterface) {
                        throw new LogicException('PSR-17 response factory service is invalid.');
                    }

                    return $factory;
                },
            )
            ->set(
                StreamFactoryInterface::class,
                static function (ContainerInterface $container): StreamFactoryInterface {
                    $factory = $container->get(Psr17Factory::class);

                    if (!$factory instanceof StreamFactoryInterface) {
                        throw new LogicException('PSR-17 stream factory service is invalid.');
                    }

                    return $factory;
                },
            )
            ->set(RequestIdHolder::class, static fn (ContainerInterface $container): RequestIdHolder => new RequestIdHolder())
            ->set(
                MailerInterface::class,
                static function (ContainerInterface $container): MailerInterface {
                    // MAIL_DSN drives the transport; default null transport is a no-op so
                    // submissions never fail when SMTP is not configured (best-effort, charter §7).
                    $dsn = $_SERVER['MAIL_DSN'] ?? $_ENV['MAIL_DSN'] ?? getenv('MAIL_DSN');
                    $dsn = is_string($dsn) && $dsn !== '' ? $dsn : 'null://null';

                    return new Mailer(Transport::fromDsn($dsn));
                },
            )
            ->set(
                LocalBearerTokenVerifier::class,
                static function (ContainerInterface $container): LocalBearerTokenVerifier {
                    $config = $container->get(AppConfig::class);

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    return new LocalBearerTokenVerifier(GuardedJwtSecretResolver::fromConfig($config, self::DEFAULT_DEV_SECRET));
                },
            )
            ->set(
                TokenVerifierInterface::class,
                static function (ContainerInterface $container): TokenVerifierInterface {
                    $verifier = $container->get(LocalBearerTokenVerifier::class);

                    if (!$verifier instanceof TokenVerifierInterface) {
                        throw new LogicException('Local bearer token verifier service is invalid.');
                    }

                    return $verifier;
                },
            )
            ->set(
                TokenIssuerInterface::class,
                static function (ContainerInterface $container): TokenIssuerInterface {
                    $issuer = $container->get(LocalBearerTokenVerifier::class);

                    if (!$issuer instanceof TokenIssuerInterface) {
                        throw new LogicException('Local bearer token issuer service is invalid.');
                    }

                    return $issuer;
                },
            )
            ->set(
                LoggerInterface::class,
                static function (ContainerInterface $container): LoggerInterface {
                    $config = $container->get(AppConfig::class);
                    $debug = $config instanceof AppConfig && $config->debug;
                    $holder = $container->get(RequestIdHolder::class);

                    return (new MonologLoggerFactory())->create('nene-contact', $debug, $holder instanceof RequestIdHolder ? $holder : null);
                },
            )
            ->set(
                RuntimeApplicationFactory::class,
                static function (ContainerInterface $container): RuntimeApplicationFactory {
                    $responseFactory = $container->get(ResponseFactoryInterface::class);
                    $streamFactory = $container->get(StreamFactoryInterface::class);
                    $logger = $container->get(LoggerInterface::class);
                    $config = $container->get(AppConfig::class);
                    $requestIdHolder = $container->get(RequestIdHolder::class);
                    $exceptionHandlers = $container->get(ApplicationServiceProvider::EXCEPTION_HANDLERS);
                    $routeRegistrars = $container->get(ApplicationServiceProvider::ROUTE_REGISTRARS);

                    if (!$responseFactory instanceof ResponseFactoryInterface) {
                        throw new LogicException('Response factory service is invalid.');
                    }

                    if (!$streamFactory instanceof StreamFactoryInterface) {
                        throw new LogicException('Stream factory service is invalid.');
                    }

                    if (!$logger instanceof LoggerInterface) {
                        throw new LogicException('Logger service is invalid.');
                    }

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    if (!$requestIdHolder instanceof RequestIdHolder) {
                        throw new LogicException('RequestIdHolder service is invalid.');
                    }

                    if (!is_array($exceptionHandlers) || !array_is_list($exceptionHandlers)) {
                        throw new LogicException('Exception handlers service is invalid.');
                    }

                    if (!is_array($routeRegistrars) || !array_is_list($routeRegistrars)) {
                        throw new LogicException('Route registrars service is invalid.');
                    }

                    /** @var list<DomainExceptionHandlerInterface> $exceptionHandlers */
                    /** @var list<callable(\Nene2\Routing\Router): void> $routeRegistrars */

                    $orgRepo = $container->get(OrganizationRepositoryInterface::class);
                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);
                    $orgIdHolder = $container->get(ApplicationServiceProvider::ORG_ID_HOLDER);

                    if (!$orgRepo instanceof OrganizationRepositoryInterface) {
                        throw new LogicException('Organization repository service is invalid.');
                    }

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    if (!$orgIdHolder instanceof RequestScopedHolder) {
                        throw new LogicException('Org id holder service is invalid.');
                    }

                    /** @var RequestScopedHolder<int> $orgIdHolder */

                    // Read like NENE2 ConfigLoader: Dotenv populates $_SERVER/$_ENV (not getenv).
                    $env = static function (string $key, string $default): string {
                        $value = $_SERVER[$key] ?? $_ENV[$key] ?? getenv($key);

                        return is_string($value) && $value !== '' ? $value : $default;
                    };

                    $mode = $env('TENANT_RESOLUTION', 'single');
                    $orgSlug = $env('ORG_SLUG', '');
                    $baseDomain = $env('BASE_DOMAIN', 'localhost');

                    // Machine API key (NENE2 ApiKeyAuthenticationMiddleware) gates the agent
                    // read surface `/api/*` (M6). Unset → null → the middleware fails closed (401).
                    $machineApiKeyRaw = $env('NENE2_MACHINE_API_KEY', '');
                    $machineApiKey = $machineApiKeyRaw !== '' ? $machineApiKeyRaw : null;

                    $strategy = match ($mode) {
                        'path' => new PathPrefixResolutionStrategy(),
                        'subdomain' => new SubdomainResolutionStrategy($baseDomain),
                        'custom_domain' => new CustomDomainResolutionStrategy(),
                        default => new EnvResolutionStrategy($orgSlug),
                    };

                    $orgResolver = new OrgResolverMiddleware($orgIdHolder, $orgRepo, $problemDetails, $strategy);

                    $tokenVerifier = $container->get(TokenVerifierInterface::class);

                    if (!$tokenVerifier instanceof TokenVerifierInterface) {
                        throw new LogicException('Token verifier service is invalid.');
                    }

                    $adminAuth = new AdminApiAuthMiddleware($problemDetails, $tokenVerifier);
                    $capability = new CapabilityMiddleware($problemDetails);

                    $throttle = $container->get(PublicSubmitThrottleMiddleware::class);

                    if (!$throttle instanceof PublicSubmitThrottleMiddleware) {
                        throw new LogicException('Public submit throttle middleware service is invalid.');
                    }

                    $publicFormReader = $container->get(PublicFormReaderInterface::class);

                    if (!$publicFormReader instanceof PublicFormReaderInterface) {
                        throw new LogicException('Public form reader service is invalid.');
                    }

                    $cors = new PublicCorsMiddleware($publicFormReader);

                    return new RuntimeApplicationFactory(
                        responseFactory: $responseFactory,
                        streamFactory: $streamFactory,
                        logger: $logger,
                        machineApiKey: $machineApiKey,
                        domainExceptionHandlers: $exceptionHandlers,
                        requestIdHolder: $requestIdHolder,
                        routeRegistrars: $routeRegistrars,
                        authMiddleware: [$cors, $throttle, $orgResolver, $adminAuth, $capability],
                        debug: $config->debug,
                        machineApiKeyProtectedPaths: [],
                        machineApiKeyProtectedPathPrefixes: ['/api/'],
                        requestMaxBodyBytes: 64 * 1024,
                        problemDetailsBaseUrl: $config->problemDetailsBaseUrl,
                    );
                },
            )
            ->set(
                RequestHandlerInterface::class,
                static function (ContainerInterface $container): RequestHandlerInterface {
                    $factory = $container->get(RuntimeApplicationFactory::class);

                    if (!$factory instanceof RuntimeApplicationFactory) {
                        throw new LogicException('Runtime application factory service is invalid.');
                    }

                    return $factory->create();
                },
            )
            ->set(ResponseEmitter::class, static fn (ContainerInterface $container): ResponseEmitter => new ResponseEmitter());
    }
}
