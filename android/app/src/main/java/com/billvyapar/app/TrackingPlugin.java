package com.billvyapar.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TrackingService")
public class TrackingPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        String employeeId = call.getString("employeeId", "");
        String ownerUserId = call.getString("ownerUserId", "");
        String name = call.getString("name", "");
        String backendUrl = call.getString("backendUrl", "");

        // Also request battery optimization exemption on first start
        requestBatteryOptimizationExemption();

        Intent intent = new Intent(getContext(), TrackingService.class);
        intent.putExtra("employeeId", employeeId);
        intent.putExtra("ownerUserId", ownerUserId);
        intent.putExtra("name", name);
        intent.putExtra("backendUrl", backendUrl);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        // Directly stop the service — do NOT route through startForegroundService+STOP action
        // because some Android versions handle that path unreliably.
        Intent intent = new Intent(getContext(), TrackingService.class);
        getContext().stopService(intent);
        call.resolve();
    }

    @PluginMethod
    public void isBatteryOptimized(PluginCall call) {
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        boolean isIgnoring = pm != null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
        call.resolve(new com.getcapacitor.JSObject().put("optimized", !isIgnoring));
    }

    private void requestBatteryOptimizationExemption() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(getContext().getPackageName())) {
                Intent intent = new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try {
                    getContext().startActivity(intent);
                } catch (Exception e) {
                    // Some OEMs block this intent — user has to do it manually
                }
            }
        }
    }
}
