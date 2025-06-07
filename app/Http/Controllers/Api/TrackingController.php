<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\TrackIncoming;

class TrackingController extends Controller
{
    /**
     * Generate a unique recall number for tracking requests
     */
    public function generateRecall(Request $request): JsonResponse
    {
        try {
            // Generate a unique recall number
            $timestamp = now()->format('YmdHis');
            $random = str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $recallNumber = "RCL-{$timestamp}-{$random}";
            
            // Ensure uniqueness by checking against existing records
            $attempts = 0;
            while (TrackIncoming::where('recall_number', $recallNumber)->exists() && $attempts < 10) {
                $random = str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
                $recallNumber = "RCL-{$timestamp}-{$random}";
                $attempts++;
            }
            
            return response()->json([
                'success' => true,
                'recall_number' => $recallNumber,
                'message' => 'Recall number generated successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'recall_number' => null,
                'message' => 'Failed to generate recall number: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Validate a recall number format
     */
    public function validateRecall(Request $request): JsonResponse
    {
        $recallNumber = $request->get('recall_number');
        
        if (!$recallNumber) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'Recall number is required'
            ], 400);
        }
        
        // Basic format validation (RCL-YYYYMMDDHHMMSS-XXXX)
        $pattern = '/^RCL-\d{14}-\d{4}$/';
        $isValidFormat = preg_match($pattern, $recallNumber);
        
        // Check if recall number already exists
        $exists = TrackIncoming::where('recall_number', $recallNumber)->exists();
        
        return response()->json([
            'success' => true,
            'valid' => $isValidFormat && !$exists,
            'format_valid' => $isValidFormat,
            'already_exists' => $exists,
            'recall_number' => $recallNumber
        ]);
    }
}
