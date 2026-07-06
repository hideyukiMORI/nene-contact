<?php

declare(strict_types=1);

namespace NeneContact\RateLimit;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Middleware\RateLimitStorageInterface;
use Psr\Container\ContainerInterface;

final readonly class RateLimitServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                RateLimitStorageInterface::class,
                static function (ContainerInterface $c): RateLimitStorageInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $clock = $c->get(ClockInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('Clock service is invalid.');
                    }

                    return new PdoRateLimitStorage($query, $clock);
                },
            )
            ->set(
                PublicSubmitThrottleMiddleware::class,
                static function (ContainerInterface $c): PublicSubmitThrottleMiddleware {
                    $storage = $c->get(RateLimitStorageInterface::class);
                    $pd = $c->get(ProblemDetailsResponseFactory::class);
                    $clock = $c->get(ClockInterface::class);

                    if (!$storage instanceof RateLimitStorageInterface) {
                        throw new LogicException('Rate limit storage service is invalid.');
                    }

                    if (!$pd instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('Clock service is invalid.');
                    }

                    return new PublicSubmitThrottleMiddleware($storage, $pd, $clock);
                },
            );
    }
}
