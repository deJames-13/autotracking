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
            $table->foreignId('technician_id')->constrained('users', 'employee_id')->onDelete('restrict');
            $table->text('description');
            $table->foreignId('equipment_id')->constrained('equipments', 'equipment_id')->onDelete('cascade');
            $table->foreignId('location_id')->constrained('locations', 'location_id')->onDelete('restrict');
            $table->dateTime('due_date');
            $table->dateTime('date_in');
            $table->foreignId('employee_id_in')->constrained('users', 'employee_id')->onDelete('restrict');
            $table->foreignId('received_by_id')->nullable()->constrained('users', 'employee_id')->onDelete('set null');

            $table->enum('status', ['for_confirmation', 'pending_calibration','completed'])->default('pending_calibration');
            $table->string('serial_number')->nullable();
            $table->string('model')->nullable();
            $table->string('manufacturer')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
        Schema::create('track_outgoing', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('incoming_id');
            $table->foreign('incoming_id')->references('id')->on('track_incoming')->onDelete('cascade');
            $table->date('cal_date');
            $table->date('cal_due_date');
            $table->enum('status', ['for_pickup', 'completed'])->default('for_pickup');
            $table->foreignId('employee_id_out')->nullable()->constrained('users', 'employee_id')->onDelete('set null');
            $table->foreignId('released_by_id')->nullable()->constrained('users', 'employee_id')->onDelete('set null');
            $table->dateTime('date_out')->nullable();

            $table->integer('cycle_time')->nullable();
            $table->integer('ct_reqd')->nullable();
            $table->integer('commit_etc')->nullable();
            $table->integer('actual_etc')->nullable();
            $table->integer('overdue')->nullable();
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
