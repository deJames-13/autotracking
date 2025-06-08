<?php

namespace Database\Factories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Department>
 */
class DepartmentFactory extends Factory
{
    protected $model = Department::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'department_name' => $this->faker->randomElement([
                'Admin',
                'Calibrations',
                'Tracking',
                'Constructions',
                'HR',
                'Electrical',
                'IT',
                'Quality Assurance',
                'Manufacturing'
            ]),
        ];
    }

    /**
     * Create an admin department
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'department_name' => 'Admin',
        ]);
    }

    /**
     * Create a calibrations department
     */
    public function calibrations(): static
    {
        return $this->state(fn (array $attributes) => [
            'department_name' => 'Calibrations',
        ]);
    }
}
