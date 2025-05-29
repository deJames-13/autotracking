<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrackingController extends Controller
{
    /**
     * Display the tracking index page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        return Inertia::render('admin/tracking/index');
    }

    /**
     * Display the tracking request index page.
     *
     * @return \Inertia\Response
     */
    public function requestIndex()
    {
        return Inertia::render('admin/tracking/request/index');
    }

    /**
     * Display a specific tracking request.
     *
     * @param int $id
     * @return \Inertia\Response
     */
    public function requestShow($id)
    {
        return Inertia::render('admin/tracking/request/detail-tab');
    }
}
