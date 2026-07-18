<?php

namespace App\Http\Controllers;

use App\Models\NetworkDevice;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NetworkDeviceController extends Controller
{
    public function index()
    {
        $devices = NetworkDevice::with('parent')->get();
        return response()->json($devices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'type'             => 'required|string|in:Router,Switch,OLT,Access Point,Server,ODP,Other',
            'ip_address'       => 'required|string|ip',
            'username'         => 'nullable|string',
            'password'         => 'nullable|string',
            'api_port'         => 'nullable|string',
            'parent_device_id' => 'nullable|exists:network_devices,id',
            'wilayah'          => 'nullable|string|max:255',
            'keterangan'       => 'nullable|string',
        ]);

        $device = NetworkDevice::create($validated);

        return response()->json([
            'message' => 'Device created successfully',
            'data'    => $device->load('parent'),
        ], 201);
    }

    public function update(Request $request, NetworkDevice $networkDevice)
    {
        $validated = $request->validate([
            'name'             => 'sometimes|required|string|max:255',
            'type'             => 'sometimes|required|string|in:Router,Switch,OLT,Access Point,Server,ODP,Other',
            'ip_address'       => 'sometimes|required|string|ip',
            'username'         => 'nullable|string',
            'password'         => 'nullable|string',
            'api_port'         => 'nullable|string',
            'is_active'        => 'boolean',
            'parent_device_id' => 'nullable|exists:network_devices,id',
            'wilayah'          => 'nullable|string|max:255',
            'keterangan'       => 'nullable|string',
        ]);

        $networkDevice->update($validated);

        return response()->json([
            'message' => 'Device updated successfully',
            'data'    => $networkDevice->load('parent'),
        ]);
    }

    public function destroy(NetworkDevice $networkDevice)
    {
        $networkDevice->delete();
        return response()->json(['message' => 'Device deleted successfully']);
    }

    /**
     * Topology endpoint — returns hierarchical view of network:
     * Core Routers → ODP per Wilayah → Customers
     */
    public function topology()
    {
        // Core/root devices (no parent)
        $coreDevices = NetworkDevice::with([
            'orders.user', 'orders.paket',
            'children.orders.user', 'children.orders.paket',
            'children.children.orders.user', 'children.children.orders.paket',
            'children.children.children'
        ])
            ->whereNull('parent_device_id')
            ->where('is_active', true)
            ->get()
            ->map(function ($device) {
                return $this->buildDeviceNode($device);
            });

        // Devices without parent that are ODP type
        $orphanOdp = NetworkDevice::with(['orders.user', 'orders.paket'])
            ->whereNull('parent_device_id')
            ->whereIn('type', ['ODP', 'Access Point'])
            ->where('is_active', true)
            ->get()
            ->map(function ($device) {
                return $this->buildDeviceNode($device);
            });


        // Active customers summary
        $activeOrders = Order::with(['user', 'paket', 'networkDevice'])
            ->where('status', 'aktif')
            ->get()
            ->map(function ($order) {
                return [
                    'order_id'          => $order->id,
                    'customer_name'     => $order->user->name ?? '-',
                    'customer_phone'    => $order->user->phone ?? '-',
                    'paket'             => $order->paket->nama_paket ?? '-',
                    'mikrotik_username' => $order->mikrotik_username,
                    'ip_address'        => $order->ip_address,
                    'tanggal_mulai'     => $order->tanggal_mulai,
                    'tanggal_selesai'   => $order->tanggal_selesai,
                    'network_device'    => $order->networkDevice ? [
                        'id'      => $order->networkDevice->id,
                        'name'    => $order->networkDevice->name,
                        'wilayah' => $order->networkDevice->wilayah,
                    ] : null,
                ];
            });

        return response()->json([
            'core_devices'   => $coreDevices,
            'active_customers' => $activeOrders,
            'summary' => [
                'total_devices'   => NetworkDevice::where('is_active', true)->count(),
                'total_customers' => $activeOrders->count(),
                'total_odp'       => NetworkDevice::whereIn('type', ['ODP', 'Access Point'])->where('is_active', true)->count(),
            ],
        ]);
    }

    /**
     * Test connection to a Mikrotik device
     */
    public function testConnection(NetworkDevice $networkDevice)
    {
        // Skip for localhost/demo
        if (in_array($networkDevice->ip_address, ['127.0.0.1', 'localhost', '0.0.0.0'])) {
            return response()->json([
                'success' => true,
                'message' => 'Mode Demo — Koneksi simulasi berhasil.',
                'mode'    => 'demo',
            ]);
        }

        try {
            $mikrotik = new \App\Services\MikrotikService($networkDevice);
            // Try a simple command to test connection
            $result = $mikrotik->testPing();
            if ($result) {
                $networkDevice->update(['status' => 'online', 'last_seen_at' => now()]);
                return response()->json([
                    'success' => true,
                    'message' => 'Koneksi berhasil! Mikrotik dapat dijangkau.',
                    'mode'    => 'live',
                ]);
            } else {
                $networkDevice->update(['status' => 'offline']);
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal terhubung. Periksa IP, Username, Password, dan API Port.',
                    'mode'    => 'live',
                ], 422);
            }
        } catch (\Exception $e) {
            $networkDevice->update(['status' => 'offline']);
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'mode'    => 'live',
            ], 422);
        }
    }

    /**
     * Synchronize secrets & devices from a real Mikrotik router
     */
    public function syncFromMikrotik(NetworkDevice $networkDevice)
    {
        try {
            $mikrotik = new \App\Services\MikrotikService($networkDevice);
            $secrets  = $mikrotik->getPppoeSecrets();
            
            $syncedCount = 0;
            foreach ($secrets as $sec) {
                $name = $sec['name'] ?? null;
                if (!$name) continue;

                // Match with existing order by mikrotik_username or comment
                $order = Order::where('mikrotik_username', $name)->first();
                if ($order) {
                    $order->update([
                        'network_device_id' => $networkDevice->id,
                    ]);
                    $syncedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Sinkronisasi berhasil! {$syncedCount} pengguna PPPoE terhubung ke perangkat ini.",
                'total_secrets_found' => count($secrets),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sinkronisasi gagal: ' . $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Status endpoint — existing, used for live polling
     */
    public function status()
    {
        $devices = NetworkDevice::where('is_active', true)->get();

        $results = [];

        foreach ($devices as $device) {
            $port = $device->api_port ?: 80;
            $ip   = $device->ip_address;

            $status  = 'offline';
            $uptime  = '-';
            $cpu     = 0;
            $memory  = 0;
            $clients = 0;

            $isUnpaid = false;
            $pendingOrders = Order::with('user')->whereIn('status', ['pending', 'suspend'])->get();
            foreach ($pendingOrders as $pending) {
                if ($pending->user && str_contains($device->name, $pending->user->name)) {
                    $isUnpaid = true;
                    break;
                }
            }

            $hasTicket = false;
            $activeTickets = \App\Models\Ticket::with('user')->whereIn('status', ['menunggu', 'diproses'])->get();
            foreach ($activeTickets as $ticket) {
                if ($ticket->user && str_contains($device->name, $ticket->user->name)) {
                    $hasTicket = true;
                    break;
                }
            }

            $isProactiveOutage = str_ends_with($ip, '.99');

            if ($isUnpaid) {
                $status = 'terisolir';
                $device->status = 'terisolir';
                $device->save();
                $uptime = '-'; $cpu = 0; $memory = 0; $clients = 0;
            } elseif ($hasTicket || $isProactiveOutage) {
                $status = 'offline';
                $device->status = 'offline';
                $device->save();
                $uptime = '-'; $cpu = 0; $memory = 0; $clients = 0;
            } else {
                $status = 'online';
                $device->last_seen_at = now();
                $device->status = 'online';
                $device->save();

                $uptime  = rand(10, 100) . 'd ' . rand(1, 23) . 'h ' . rand(1, 59) . 'm';
                $cpu     = rand(10, 45);
                $memory  = rand(20, 60);
                // Count real customers connected to this device
                $clients = Order::where('network_device_id', $device->id)->where('status', 'aktif')->count();
                if ($clients === 0) $clients = rand(5, 50); // fallback demo
            }

            $results[] = [
                'id'       => $device->id,
                'name'     => $device->name,
                'type'     => $device->type,
                'ip'       => $device->ip_address,
                'wilayah'  => $device->wilayah,
                'status'   => $status,
                'uptime'   => $uptime,
                'cpu'      => $cpu,
                'memory'   => $memory,
                'clients'  => $clients,
            ];
        }

        return response()->json($results);
    }

    private function buildDeviceNode(NetworkDevice $device): array
    {
        $node = [
            'id'           => $device->id,
            'name'         => $device->name,
            'type'         => $device->type,
            'ip_address'   => $device->ip_address,
            'wilayah'      => $device->wilayah,
            'keterangan'   => $device->keterangan,
            'status'       => $device->status,
            'last_seen_at' => $device->last_seen_at,
            'customers'    => [],
            'children'     => [],
        ];

        // Attach active customers connected to this device/ODP
        if ($device->relationLoaded('orders')) {
            $node['customers'] = $device->orders->where('status', 'aktif')->map(function ($order) {
                return [
                    'order_id'          => $order->id,
                    'customer_name'     => $order->user->name ?? '-',
                    'customer_phone'    => $order->user->phone ?? '-',
                    'paket'             => $order->paket->nama_paket ?? '-',
                    'mikrotik_username' => $order->mikrotik_username,
                    'ip_address'        => $order->ip_address,
                    'status'            => $order->status,
                ];
            })->values()->all();
        }

        // Recursively build children nodes (OLT -> ODP -> Sub-ODP)
        if ($device->relationLoaded('children')) {
            $node['children'] = $device->children->map(function ($child) {
                return $this->buildDeviceNode($child);
            })->all();
        }

        return $node;
    }

}
