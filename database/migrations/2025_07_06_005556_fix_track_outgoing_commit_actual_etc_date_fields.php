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
        // Use raw SQL to ensure the columns are properly set as DATE type
        DB::statement('ALTER TABLE track_outgoing MODIFY commit_etc DATE NULL');
        DB::statement('ALTER TABLE track_outgoing MODIFY actual_etc DATE NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to integer fields
        DB::statement('ALTER TABLE track_outgoing MODIFY commit_etc INT NULL');
        DB::statement('ALTER TABLE track_outgoing MODIFY actual_etc INT NULL');
    }
};
