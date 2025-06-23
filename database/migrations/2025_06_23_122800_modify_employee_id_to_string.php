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
        // First, we need to temporarily disable foreign key constraints
        Schema::disableForeignKeyConstraints();

        // Drop foreign key constraints that reference employee_id
        if (Schema::hasTable('equipments')) {
            Schema::table('equipments', function (Blueprint $table) {
                $table->dropForeign(['employee_id']);
            });
        }

        if (Schema::hasTable('track_incoming')) {
            Schema::table('track_incoming', function (Blueprint $table) {
                $table->dropForeign(['technician_id']);
                $table->dropForeign(['employee_id_in']);
                $table->dropForeign(['received_by_id']);
            });
        }

        if (Schema::hasTable('track_outgoing')) {
            Schema::table('track_outgoing', function (Blueprint $table) {
                $table->dropForeign(['employee_id_out']);
                $table->dropForeign(['released_by_id']);
            });
        }

        if (Schema::hasTable('sessions')) {
            Schema::table('sessions', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });
        }

        // Now modify the users table to change employee_id from auto-incrementing integer to string
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_id', 20)->change();
        });

        // Update related tables that reference employee_id
        if (Schema::hasTable('equipments')) {
            Schema::table('equipments', function (Blueprint $table) {
                $table->string('employee_id', 20)->change();
                // Re-add the foreign key constraint
                $table->foreign('employee_id')->references('employee_id')->on('users')->onDelete('restrict');
            });
        }

        if (Schema::hasTable('track_incoming')) {
            Schema::table('track_incoming', function (Blueprint $table) {
                if (Schema::hasColumn('track_incoming', 'technician_id')) {
                    $table->string('technician_id', 20)->nullable()->change();
                    $table->foreign('technician_id')->references('employee_id')->on('users')->onDelete('set null');
                }
                if (Schema::hasColumn('track_incoming', 'employee_id_in')) {
                    $table->string('employee_id_in', 20)->nullable()->change();
                    $table->foreign('employee_id_in')->references('employee_id')->on('users')->onDelete('set null');
                }
                if (Schema::hasColumn('track_incoming', 'received_by_id')) {
                    $table->string('received_by_id', 20)->nullable()->change();
                    $table->foreign('received_by_id')->references('employee_id')->on('users')->onDelete('set null');
                }
            });
        }

        if (Schema::hasTable('track_outgoing')) {
            Schema::table('track_outgoing', function (Blueprint $table) {
                if (Schema::hasColumn('track_outgoing', 'employee_id_out')) {
                    $table->string('employee_id_out', 20)->nullable()->change();
                    $table->foreign('employee_id_out')->references('employee_id')->on('users')->onDelete('set null');
                }
            });
        }

        if (Schema::hasTable('password_reset_tokens')) {
            Schema::table('password_reset_tokens', function (Blueprint $table) {
                $table->string('employee_id', 20)->change();
            });
        }

        if (Schema::hasTable('sessions')) {
            Schema::table('sessions', function (Blueprint $table) {
                $table->string('user_id', 20)->nullable()->change();
                // Re-add the foreign key constraint
                $table->foreign('user_id')->references('employee_id')->on('users')->onDelete('cascade');
            });
        }

        // Re-enable foreign key constraints
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is not easily reversible as it changes data types
        // and existing string employee IDs might not fit back into integer format
        throw new Exception('This migration cannot be reversed as it may cause data loss');
    }
};
