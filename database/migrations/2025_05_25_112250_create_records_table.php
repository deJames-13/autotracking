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
            $table->foreignId('equipment_id')->constrained('equipments', 'equipment_id')->onDelete('cascade');
            $table->foreignId('technician_id')->constrained('users', 'employee_id')->onDelete('restrict');
            $table->foreignId('location_id')->constrained('locations', 'location_id')->onDelete('restrict');
            $table->dateTime('due_date')->useCurrent();
            $table->dateTime('date_in');
            $table->foreignId('employee_id_in')->constrained('users', 'employee_id')->onDelete('restrict');
            $table->date('cal_date');
            $table->date('cal_due_date');
            $table->dateTime('date_out')->nullable();
            $table->foreignId('employee_id_out')->nullable()->constrained('users', 'employee_id')->onDelete('set null');
            $table->integer('cycle_time');
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
