<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipments', function (Blueprint $table) {
            $table->id('equipment_id');
            $table->string('employee_id')->nullable();
            $table->string('serial_number')->unique();
            $table->text('description');
            $table->string('manufacturer');
            $table->timestamps();

            $table->foreign('employee_id')->references('employee_id')->on('users')->onDelete('set null');
            $table->index(['employee_id', 'manufacturer', 'serial_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipments');
    }
};
