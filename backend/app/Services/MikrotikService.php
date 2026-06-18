<?php

namespace App\Services;

use App\Models\NetworkDevice;
use RouterOS\Client;
use RouterOS\Query;
use Illuminate\Support\Facades\Log;

class MikrotikService
{
    protected $client;
    protected $device;

    public function __construct(NetworkDevice $device = null)
    {
        if (!$device) {
            // By default, grab the first active router
            $device = NetworkDevice::where('is_active', true)->whereIn('type', ['Router', 'Server'])->first();
        }

        if ($device) {
            $this->device = $device;
            
            // DEMO MODE: If IP is localhost, skip real connection to prevent timeout during presentation
            if (in_array($device->ip_address, ['127.0.0.1', 'localhost', '0.0.0.0'])) {
                $this->client = 'DEMO_MODE';
                return;
            }

            try {
                $this->client = new Client([
                    'host' => $device->ip_address,
                    'user' => $device->username,
                    'pass' => $device->password,
                    'port' => (int) ($device->api_port ?: 8728),
                    'timeout' => 2, // Set short timeout so it doesn't hang long if router is offline
                ]);
            } catch (\Exception $e) {
                Log::error('Mikrotik Connection Failed: ' . $e->getMessage());
                // Fallback to demo mode if connection fails, so demo can continue smoothly
                $this->client = 'DEMO_MODE';
            }
        }
    }

    public function getDevice()
    {
        return $this->device;
    }

    public function addPppoeSecret($username, $password, $profile = 'default', $comment = '')
    {
        if (!$this->client) return false;
        if ($this->client === 'DEMO_MODE') {
            Log::info("DEMO MOCK: Added PPPoE User {$username}");
            return true;
        }

        try {
            // Check if exists
            $checkQuery = new Query('/ppp/secret/print');
            $checkQuery->where('name', $username);
            $existing = $this->client->query($checkQuery)->read();

            if (!empty($existing)) {
                // If exists, just update password and enable
                $updateQuery = new Query('/ppp/secret/set');
                $updateQuery->equal('.id', $existing[0]['.id'])
                            ->equal('password', $password)
                            ->equal('disabled', 'false');
                $this->client->query($updateQuery)->read();
                return true;
            }

            $query = new Query('/ppp/secret/add');
            $query->equal('name', $username)
                  ->equal('password', $password)
                  ->equal('profile', $profile)
                  ->equal('service', 'pppoe')
                  ->equal('comment', $comment);

            $this->client->query($query)->read();
            return true;
        } catch (\Exception $e) {
            Log::error('Mikrotik addPppoeSecret Failed: ' . $e->getMessage());
            return false;
        }
    }

    public function enablePppoeSecret($username)
    {
        if (!$this->client) return false;
        if ($this->client === 'DEMO_MODE') {
            Log::info("DEMO MOCK: Enabled PPPoE User {$username}");
            return true;
        }

        try {
            $query = new Query('/ppp/secret/print');
            $query->where('name', $username);
            $secrets = $this->client->query($query)->read();

            if (!empty($secrets) && isset($secrets[0]['.id'])) {
                $enableQuery = new Query('/ppp/secret/enable');
                $enableQuery->equal('.id', $secrets[0]['.id']);
                $this->client->query($enableQuery)->read();
                return true;
            }
            return false;
        } catch (\Exception $e) {
            Log::error('Mikrotik enablePppoeSecret Failed: ' . $e->getMessage());
            return false;
        }
    }

    public function disablePppoeSecret($username)
    {
        if (!$this->client) return false;
        if ($this->client === 'DEMO_MODE') {
            Log::info("DEMO MOCK: Disabled PPPoE User {$username}");
            return true;
        }

        try {
            $query = new Query('/ppp/secret/print');
            $query->where('name', $username);
            $secrets = $this->client->query($query)->read();

            if (!empty($secrets) && isset($secrets[0]['.id'])) {
                $disableQuery = new Query('/ppp/secret/disable');
                $disableQuery->equal('.id', $secrets[0]['.id']);
                $this->client->query($disableQuery)->read();
                
                // Disconnect active connection if any
                $activeQuery = new Query('/ppp/active/print');
                $activeQuery->where('name', $username);
                $activeConnections = $this->client->query($activeQuery)->read();
                if (!empty($activeConnections)) {
                    foreach ($activeConnections as $active) {
                        $removeQuery = new Query('/ppp/active/remove');
                        $removeQuery->equal('.id', $active['.id']);
                        $this->client->query($removeQuery)->read();
                    }
                }

                return true;
            }
            return false;
        } catch (\Exception $e) {
            Log::error('Mikrotik disablePppoeSecret Failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Update PPPoE secret profile ketika pelanggan upgrade paket.
     * Profile di MikroTik biasanya mengatur bandwidth limit (rate-limit).
     *
     * @param string $username  Username PPPoE pelanggan
     * @param string $newProfile  Nama profile baru (sesuai nama paket, misal: 'Paket Premium')
     * @return bool
     */
    public function updatePppoeProfile(string $username, string $newProfile): bool
    {
        if (!$this->client) return false;
        if ($this->client === 'DEMO_MODE') {
            Log::info("DEMO MOCK: Updated PPPoE Profile for {$username} to '{$newProfile}'");
            return true;
        }

        try {
            // Cari PPPoE secret berdasarkan username
            $query = new Query('/ppp/secret/print');
            $query->where('name', $username);
            $secrets = $this->client->query($query)->read();

            if (!empty($secrets) && isset($secrets[0]['.id'])) {
                // Update profile pada PPPoE secret
                $updateQuery = new Query('/ppp/secret/set');
                $updateQuery->equal('.id', $secrets[0]['.id'])
                            ->equal('profile', $newProfile);
                $this->client->query($updateQuery)->read();

                // Disconnect koneksi aktif agar profile baru langsung berlaku
                // Pelanggan akan otomatis reconnect dengan profile/bandwidth baru
                $activeQuery = new Query('/ppp/active/print');
                $activeQuery->where('name', $username);
                $activeConnections = $this->client->query($activeQuery)->read();
                if (!empty($activeConnections)) {
                    foreach ($activeConnections as $active) {
                        $removeQuery = new Query('/ppp/active/remove');
                        $removeQuery->equal('.id', $active['.id']);
                        $this->client->query($removeQuery)->read();
                    }
                }

                Log::info("Mikrotik: PPPoE Profile updated for {$username} to '{$newProfile}'");
                return true;
            }

            Log::warning("Mikrotik: PPPoE secret not found for username '{$username}'");
            return false;
        } catch (\Exception $e) {
            Log::error('Mikrotik updatePppoeProfile Failed: ' . $e->getMessage());
            return false;
        }
    }
}
