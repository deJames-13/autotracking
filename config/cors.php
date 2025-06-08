<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'admin/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*', 'X-Inertia', 'X-Inertia-Version', 'X-Requested-With'],
    'exposed_headers' => ['X-Inertia'],
    'max_age' => 0,
    'supports_credentials' => true,
];
