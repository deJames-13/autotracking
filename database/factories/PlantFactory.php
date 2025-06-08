<?php

namespace Database\Factories;

use App\Models\Plant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Plant>
 */
class PlantFactory extends Factory
{
    protected $model = Plant::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'plant_name' => $this->faker->randomElement(['P1', 'P2', 'P3']),
            'address' => $this->faker->address(),
            'telephone' => $this->faker->phoneNumber(),
        ];
    }

    /**
     * Create Plant 1
     */
    public function p1(): static
    {
        return $this->state(fn (array $attributes) => [
            'plant_name' => 'P1',
            'address' => '123 Industrial Ave, Plant 1 District, 12345',
            'telephone' => '555-001-0001',
        ]);
    }

    /**
     * Create Plant 2
     */
    public function p2(): static
    {
        return $this->state(fn (array $attributes) => [
            'plant_name' => 'P2',
            'address' => '456 Manufacturing Blvd, Plant 2 District, 23456',
            'telephone' => '555-002-0002',
        ]);
    }

    /**
     * Create Plant 3
     */
    public function p3(): static
    {
        return $this->state(fn (array $attributes) => [
            'plant_name' => 'P3',
            'address' => '789 Production Road, Plant 3 District, 34567',
            'telephone' => '555-003-0003',
        ]);
    }
}
