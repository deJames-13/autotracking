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
        // Check if the password_reset_tokens table exists and has the wrong structure
        if (Schema::hasTable('password_reset_tokens')) {
            // Check if it has employee_id column instead of email
            if (Schema::hasColumn('password_reset_tokens', 'employee_id') && 
                !Schema::hasColumn('password_reset_tokens', 'email')) {
                
                // Drop and recreate the table with the correct structure
                Schema::drop('password_reset_tokens');
            }
        }

        // Create the password_reset_tokens table with the correct Laravel structure
        if (!Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration corrects the structure, so reverting would recreate the old structure
        if (Schema::hasTable('password_reset_tokens')) {
            Schema::drop('password_reset_tokens');
            
            // Recreate the old structure
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('employee_id')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }
    }
};
