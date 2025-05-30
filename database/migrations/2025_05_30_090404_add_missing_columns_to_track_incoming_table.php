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
        Schema::table('track_incoming', function (Blueprint $table) {
            // Add missing columns that should have been created
            $table->foreignId('received_by')->after('employee_id_in')->constrained('users', 'employee_id')->onDelete('restrict');
            $table->string('serial_number')->after('received_by')->nullable();
            $table->string('model')->after('serial_number')->nullable();
            $table->string('manufacturer')->after('model')->nullable();
            $table->text('notes')->after('status')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('track_incoming', function (Blueprint $table) {
            $table->dropForeign(['received_by']);
            $table->dropColumn(['received_by', 'serial_number', 'model', 'manufacturer', 'notes']);
        });
    }
};
