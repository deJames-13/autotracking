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
        Schema::table('track_outgoing', function (Blueprint $table) {
            $table->enum('status', ['for_pickup', 'completed'])->default('for_pickup')->after('cycle_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('track_outgoing', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
