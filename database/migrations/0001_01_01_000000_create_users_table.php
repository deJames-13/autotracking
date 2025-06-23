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
        Schema::create('plants', function (Blueprint $table) {
            $table->id('plant_id');
            $table->string('plant_name')->unique();
            $table->string('address')->nullable();
            $table->string('telephone')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
        
        Schema::create('departments', function (Blueprint $table) {
            $table->id('department_id');
            $table->string('department_name');
            $table->timestamps();
            $table->softDeletes();
        });
        
        Schema::create('roles', function (Blueprint $table) {
            $table->id('role_id');
            $table->string('role_name');
            $table->timestamps();
            $table->softDeletes();
        });
        
        Schema::create('users', function (Blueprint $table) {
            $table->string('employee_id', 20)->primary();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('email')->nullable()->unique();
            $table->string('avatar')->nullable();
            $table->string('password'); //PIN
            $table->foreignId('role_id')->constrained('roles', 'role_id')->onDelete('restrict');
            $table->timestamp('email_verified_at')->nullable(); 
            $table->foreignId('department_id')->nullable()->constrained('departments', 'department_id')->onDelete('set null');
            $table->foreignId('plant_id')->nullable()->constrained('plants', 'plant_id')->onDelete('set null');
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

        });
        
        Schema::create('locations', function (Blueprint $table) {
            $table->id('location_id');
            $table->string('location_name');
            $table->foreignId('department_id')->nullable()->constrained('departments', 'department_id')->onDelete('set null');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('employee_id', 20)->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('user_id', 20)->nullable()->index();
            $table->foreign('user_id')->references('employee_id')->on('users')->onDelete('cascade');
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
        // Temporarily disable foreign key checks to allow dropping tables in any order
        Schema::disableForeignKeyConstraints();
        
        // Drop tables in order - starting with tables that reference others
        if (Schema::hasTable('tracking_records')) {
            Schema::dropIfExists('tracking_records');
        }
        
        if (Schema::hasTable('equipments')) {
            Schema::dropIfExists('equipments');
        }
        
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('plants');
        
        // Re-enable foreign key checks
        Schema::enableForeignKeyConstraints();
    }
};
