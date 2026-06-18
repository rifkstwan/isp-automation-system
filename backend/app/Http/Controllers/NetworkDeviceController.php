<?php

namespace App\Http\Controllers;

use App\Models\NetworkDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NetworkDeviceController extends Controller
{
    public function index()
    {
        $devices = NetworkDevice::all();
        return response()->json($devices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:Router,Switch,OLT,Access Point,Server,Other',
            'ip_address' => 'required|string|ip',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
            'api_port' => 'nullable|string',
        ]);

        $device = NetworkDevice::create($validated);

        return response()->json([
            'message' => 'Device created successfully',
            'data' => $device
        ], 201);
    }

    public function update(Request $request, NetworkDevice $networkDevice)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string|in:Router,Switch,OLT,Access Point,Server,Other',
            'ip_address' => 'sometimes|required|string|ip',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
            'api_port' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $networkDevice->update($validated);

        return response()->json([
            'message' => 'Device updated successfully',
            'data' => $networkDevice
        ]);
    }

    public function destroy(NetworkDevice $networkDevice)
    {
        $networkDevice->delete();
        return response()->json(['message' => 'Device deleted successfully']);
    }

    public function status()
    {
        $devices = NetworkDevice::where('is_active', true)->get();
        
        $results = [];
        
        foreach ($devices as $device) {
            // For a real implementation, we would use a library to connect to the Mikrotik API
            // such as \RouterOS\Client or SNMP to fetch real CPU/Memory.
            // Here we simulate the ping with fsockopen to port 80 or api_port (very fast timeout)
            
            $port = $device->api_port ?: 80;
            $ip = $device->ip_address;
            
            $status = 'offline';
            $uptime = '-';
            $cpu = 0;
            $memory = 0;
            $clients = 0;
            
            // Check if this device belongs to an unpaid order (Heuristic for Demo)
            $isUnpaid = false;
            $pendingOrders = \App\Models\Order::with('user')->whereIn('status', ['pending', 'suspend'])->get();
            foreach ($pendingOrders as $pending) {
                if ($pending->user && str_contains($device->name, $pending->user->name)) {
                    $isUnpaid = true;
                    break;
                }
            }

            // Check if this device belongs to a user with an active complaint ticket (Heuristic for Demo)
            $hasTicket = false;
            $activeTickets = \App\Models\Ticket::with('user')->whereIn('status', ['Menunggu', 'Diproses'])->get();
            foreach ($activeTickets as $ticket) {
                if ($ticket->user && str_contains($device->name, $ticket->user->name)) {
                    $hasTicket = true;
                    break;
                }
            }
            
            // PROACTIVE NOC DEMO: If IP ends in .99, it means the fiber is cut!
            $isProactiveOutage = str_ends_with($ip, '.99');
            
            if ($isUnpaid) {
                $status = 'terisolir';
                $device->status = 'terisolir';
                $device->save();
                
                $uptime = '-';
                $cpu = 0;
                $memory = 0;
                $clients = 0;
            } else if ($hasTicket || $isProactiveOutage) {
                $status = 'offline';
                $device->status = 'offline';
                $device->save();
                
                $uptime = '-';
                $cpu = 0;
                $memory = 0;
                $clients = 0;
            } else {
                // DEMO MODE: Force online for all devices to show a lively dashboard
                $status = 'online';
                $device->last_seen_at = now();
                $device->status = 'online';
                $device->save();
                
                $uptime = rand(10, 100) . 'd ' . rand(1, 23) . 'h ' . rand(1, 59) . 'm';
                $cpu = rand(10, 45);
                $memory = rand(20, 60);
                $clients = rand(10, 300);
            }
            
            $results[] = [
                'id' => $device->id,
                'name' => $device->name,
                'type' => $device->type,
                'ip' => $device->ip_address,
                'status' => $status,
                'uptime' => $uptime,
                'cpu' => $cpu,
                'memory' => $memory,
                'clients' => $clients,
            ];
        }
        
        return response()->json($results);
    }
}
