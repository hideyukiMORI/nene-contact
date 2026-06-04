<?php

declare(strict_types=1);

namespace NeneContact\Records;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use NeneContact\Upstream\HttpRecordsClient;
use NeneContact\Upstream\RecordsClientInterface;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Container\ContainerInterface;
use Psr\Http\Client\ClientInterface;

final readonly class RecordsServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                RecordsClientInterface::class,
                static function (ContainerInterface $c): RecordsClientInterface {
                    $http = $c->get(ClientInterface::class);
                    $psr17 = $c->get(Psr17Factory::class);

                    if (!$http instanceof ClientInterface) {
                        throw new LogicException('HTTP client service is invalid.');
                    }

                    if (!$psr17 instanceof Psr17Factory) {
                        throw new LogicException('PSR-17 factory service is invalid.');
                    }

                    $baseUrl = $_SERVER['NENE_RECORDS_API_BASE_URL'] ?? $_ENV['NENE_RECORDS_API_BASE_URL'] ?? getenv('NENE_RECORDS_API_BASE_URL');
                    $token = $_SERVER['NENE_RECORDS_BEARER_TOKEN'] ?? $_ENV['NENE_RECORDS_BEARER_TOKEN'] ?? getenv('NENE_RECORDS_BEARER_TOKEN');

                    return new HttpRecordsClient(
                        $http,
                        $psr17,
                        is_string($baseUrl) ? $baseUrl : '',
                        is_string($token) ? $token : '',
                    );
                },
            )
            ->set(
                FetchRecordsOptionsUseCaseInterface::class,
                static function (ContainerInterface $c): FetchRecordsOptionsUseCaseInterface {
                    $records = $c->get(RecordsClientInterface::class);

                    if (!$records instanceof RecordsClientInterface) {
                        throw new LogicException('Records client service is invalid.');
                    }

                    return new FetchRecordsOptionsUseCase($records);
                },
            )
            ->set(
                RecordsOptionsHandler::class,
                static function (ContainerInterface $c): RecordsOptionsHandler {
                    $uc = $c->get(FetchRecordsOptionsUseCaseInterface::class);
                    $json = $c->get(JsonResponseFactory::class);
                    $pd = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$uc instanceof FetchRecordsOptionsUseCaseInterface) {
                        throw new LogicException('FetchRecordsOptions use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    if (!$pd instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new RecordsOptionsHandler($uc, $json, $pd);
                },
            )
            ->set(
                RecordsRouteRegistrar::class,
                static function (ContainerInterface $c): RecordsRouteRegistrar {
                    $options = $c->get(RecordsOptionsHandler::class);

                    if (!$options instanceof RecordsOptionsHandler) {
                        throw new LogicException('Records options handler service is invalid.');
                    }

                    return new RecordsRouteRegistrar($options);
                },
            );
    }
}
