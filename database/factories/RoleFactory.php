<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Role>
 */
class RoleFactory extends Factory
{
    protected $model = Role::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'role_name' => $this->faker->randomElement(['admin', 'employee', 'technician']),
        ];
    }

    /**
     * Create an admin role
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role_name' => 'admin',
        ]);
    }

    /**
     * Create an employee role
     */
    public function employee(): static
    {
        return $this->state(fn (array $attributes) => [
            'role_name' => 'employee',
        ]);
    }

    /**
     * Create a technician role
     */
    public function technician(): static
    {
        return $this->state(fn (array $attributes) => [
            'role_name' => 'technician',
        ]);
    }
}
