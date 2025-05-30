<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('equipments', function (Blueprint $table) {
            $table->id('equipment_id');
            $table->string('recall_number')->unique();
            $table->string('serial_number')->nullable();
            $table->text('description');
            $table->foreignId('employee_id')->nullable()->constrained('users', 'employee_id')->onDelete('set null');
            $table->string('model')->nullable();
            $table->string('manufacturer')->nullable();
            
            // Location references
            $table->foreignId('plant_id')->nullable()->constrained('plants', 'plant_id')->onDelete('set null');
            $table->foreignId('department_id')->nullable()->constrained('departments', 'department_id')->onDelete('set null');
            $table->foreignId('location_id')->nullable()->constrained('locations', 'location_id')->onDelete('set null');
            
            // Equipment status and calibration tracking
            $table->enum('status', ['active', 'inactive', 'pending_calibration', 'in_calibration', 'retired'])->default('active');
            $table->date('last_calibration_date')->nullable();
            $table->date('next_calibration_due')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipments');
    }
};
