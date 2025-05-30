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
            $table->id('id');
            $table->string('recall_number')->unique();
            $table->foreignId('technician_id')->constrained('users', 'employee_id')->onDelete('restrict');
            $table->text('description');
            $table->foreignId('equipment_id')->constrained('equipments', 'equipment_id')->onDelete('cascade');
            $table->foreignId('location_id')->constrained('locations', 'location_id')->onDelete('restrict');
            $table->dateTime('due_date')->useCurrent();

            // INCOMING
            $table->dateTime('date_in');
            $table->foreignId('employee_id_in')->constrained('users', 'employee_id')->onDelete('restrict');

            // CAL
            $table->date('cal_date')->nullable();
            $table->date('cal_due_date')->nullable();
            $table->dateTime('date_out')->nullable();
            $table->foreignId('employee_id_out')->nullable()->constrained('users', 'employee_id')->onDelete('set null');
            $table->integer('cycle_time')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Explicitly drop tracking_records to ensure it's dropped before any table it references
        Schema::dropIfExists('tracking_records');
    }
};
