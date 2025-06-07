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
        if (Schema::hasTable('track_incoming') && Schema::hasColumn('track_incoming', 'recall_number')) {
            Schema::table('track_incoming', function (Blueprint $table) {
                $table->string('recall_number')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('track_incoming') && Schema::hasColumn('track_incoming', 'recall_number')) {
            Schema::table('track_incoming', function (Blueprint $table) {
                $table->string('recall_number')->nullable(false)->change();
            });
        }
    }
};