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
        Schema::create('track_incoming', function (Blueprint $table) {
            $table->id();
            $table->string('recall_number')->unique();
            $table->foreignId('technician_id')->constrained('users', 'employee_id')->onDelete('restrict');
            $table->text('description');
            $table->foreignId('equipment_id')->constrained('equipments', 'equipment_id')->onDelete('cascade');
            $table->foreignId('location_id')->constrained('locations', 'location_id')->onDelete('restrict');
            $table->dateTime('due_date');
            $table->dateTime('date_in');
            $table->foreignId('employee_id_in')->constrained('users', 'employee_id')->onDelete('restrict');
            $table->foreignId('received_by_id')->constrained('users', 'employee_id')->onDelete('restrict');

            $table->enum('status', ['pending_calibration', 'calibration_in_progress', 'ready_for_pickup'])->default('pending_calibration');
            $table->timestamps();
        });
        Schema::create('track_outgoing', function (Blueprint $table) {
            $table->id();
            $table->string('recall_number');
            $table->foreign('recall_number')->references('recall_number')->on('track_incoming')->onDelete('cascade');
            $table->date('cal_date');
            $table->date('cal_due_date');
            $table->dateTime('date_out');
            $table->foreignId('employee_id_out')->constrained('users', 'employee_id')->onDelete('restrict');
            $table->integer('cycle_time');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('track_outgoing');
        Schema::dropIfExists('track_incoming');
    }
};
