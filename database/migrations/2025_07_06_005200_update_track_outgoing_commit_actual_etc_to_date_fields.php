<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, set all existing integer values to null since they don't represent valid dates
        DB::table('track_outgoing')->update([
            'commit_etc' => null,
            'actual_etc' => null
        ]);

        // Then change the column types from integer to date
        Schema::table('track_outgoing', function (Blueprint $table) {
            $table->date('commit_etc')->nullable()->change();
            $table->date('actual_etc')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to integer fields
        Schema::table('track_outgoing', function (Blueprint $table) {
            $table->integer('commit_etc')->nullable()->change();
            $table->integer('actual_etc')->nullable()->change();
        });
    }
};
