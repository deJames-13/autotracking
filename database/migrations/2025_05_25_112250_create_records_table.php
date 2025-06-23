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
            $table->string('recall_number')->nullable();
            $table->string('technician_id', 20)->nullable();
            $table->foreign('technician_id')->references('employee_id')->on('users')->onDelete('set null');
            $table->text('description');
            $table->foreignId('equipment_id')->nullable()->constrained('equipments', 'equipment_id')->onDelete('set null');
            $table->foreignId('location_id')->nullable()->constrained('locations', 'location_id')->onDelete('set null');
            $table->dateTime('due_date');
            $table->dateTime('date_in');
            $table->string('employee_id_in', 20)->nullable();
            $table->foreign('employee_id_in')->references('employee_id')->on('users')->onDelete('set null');
            $table->string('received_by_id', 20)->nullable();
            $table->foreign('received_by_id')->references('employee_id')->on('users')->onDelete('set null');

            $table->enum('status', ['for_confirmation', 'pending_calibration','completed'])->default('pending_calibration');
            $table->string('serial_number')->nullable();
            $table->string('model')->nullable();
            $table->string('manufacturer')->nullable();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
        Schema::create('track_outgoing', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('incoming_id');
            $table->foreign('incoming_id')->references('id')->on('track_incoming')->onDelete('cascade');
            $table->date('cal_date');
            $table->date('cal_due_date');
            $table->enum('status', ['for_pickup', 'completed'])->default('for_pickup');
            $table->string('employee_id_out', 20)->nullable();
            $table->foreign('employee_id_out')->references('employee_id')->on('users')->onDelete('set null');
            $table->string('released_by_id', 20)->nullable();
            $table->foreign('released_by_id')->references('employee_id')->on('users')->onDelete('set null');
            $table->dateTime('date_out')->nullable();

            $table->integer('cycle_time')->nullable();
            $table->integer('ct_reqd')->nullable();
            $table->integer('commit_etc')->nullable();
            $table->integer('actual_etc')->nullable();
            $table->integer('overdue')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
        // Calculations for Cycle time
        // 1. Queuing Time - maybe from incoming date to cal date
        // 2. CT Reqd - required time 
        // 3. Commit ETC - estimated time to calibrate
        // 4. Actual ETC - actual time cal
        // 5. Actual Time of CT - days
        // 6. Overdue - from due date to current day
        
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
