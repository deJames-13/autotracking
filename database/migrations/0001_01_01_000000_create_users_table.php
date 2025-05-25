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
        Schema::create('departments', function (Blueprint $table) {
            $table->id('department_id');
            $table->string('department_name');
            $table->timestamps();
        });
        Schema::create('locations', function (Blueprint $table) {
            $table->id('location_id');
            $table->string('location_name');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->timestamps();
        });
        Schema::create('roles', function (Blueprint $table) {
            $table->id('role_id');
            $table->string('role_name');
            $table->timestamps();
        });
        Schema::create('users', function (Blueprint $table) {
            $table->id('employee_id');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('email')->unique();
            $table->string('password');
            $table->foreignId('role_id')->constrained('roles', 'role_id');
            $table->timestamp('email_verified_at')->nullable(); // Changed from date to timestamp
            $table->foreignId('department_id')->nullable()->constrained('departments', 'department_id');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('departments');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
