<?php

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    'guard' => ['web'],

    'providers' => [
        'users' => App\Models\User::class,
    ],

    'prefix' => 'api/v1/sanctum',

    'expiration' => null,

    'middleware' => [
        'api' => ['throttle:api'],
        'web' => ['throttle:api'],
    ],
];