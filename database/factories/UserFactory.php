<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\Department;
use App\Models\Plant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'middle_name' => fake()->boolean(30) ? fake()->firstName() : null,
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('23344466666'),
            'role_id' => Role::factory(),
            'department_id' => Department::factory(),
            'plant_id' => Plant::factory(),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Create an admin user
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role_id' => Role::factory()->admin(),
            'department_id' => Department::factory()->admin(),
        ]);
    }

    /**
     * Create an employee user
     */
    public function employee(): static
    {
        return $this->state(fn (array $attributes) => [
            'role_id' => Role::factory()->employee(),
        ]);
    }

    /**
     * Create a technician user
     */
    public function technician(): static
    {
        return $this->state(fn (array $attributes) => [
            'role_id' => Role::factory()->technician(),
            'department_id' => Department::factory()->calibrations(),
        ]);
    }

    /**
     * Create a user with existing role and department IDs
     */
    public function withExistingRelations(int $roleId = 1, ?int $departmentId = 1, ?int $plantId = 1): static
    {
        return $this->state(fn (array $attributes) => [
            'role_id' => $roleId,
            'department_id' => $departmentId,
            'plant_id' => $plantId,
        ]);
    }
}
