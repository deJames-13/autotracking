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
        Schema::create('tracking_records', function (Blueprint $table) {
            $table->id('tracking_id');
            $table->boolean('recall')->default(false);
            $table->text('description');
            $table->foreignId('location_id')->constrained('locations', 'location_id');
            $table->dateTime('date_in');
            $table->dateTime('date_out')->nullable();
            $table->date('cal_due_date');
            $table->integer('cycle_time');
            $table->foreignId('employee_id_in')->constrained('users', 'employee_id');
            $table->foreignId('employee_id_out')->nullable()->constrained('users', 'employee_id');
            $table->foreignId('equipment_id')->constrained('equipments', 'equipment_id');
            $table->foreignId('schedule_id')->constrained('schedules', 'schedule_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tracking_records');
    }
};
