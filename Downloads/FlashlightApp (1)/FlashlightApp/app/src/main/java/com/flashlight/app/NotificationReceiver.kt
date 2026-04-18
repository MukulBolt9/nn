package com.flashlight.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class NotificationReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val flashlight = FlashlightManager.getInstance(context)

        when (intent.action) {
            "com.flashlight.ACTION_TOGGLE" -> {
                flashlight.toggle()
                Log.d(TAG, "Toggled: isOn=${flashlight.isOn}")
            }
            "com.flashlight.ACTION_INTENSITY_UP" -> {
                if (!flashlight.isOn) flashlight.turnOn()
                flashlight.increaseIntensity()
                Log.d(TAG, "Intensity up: ${flashlight.currentIntensity}")
            }
            "com.flashlight.ACTION_INTENSITY_DOWN" -> {
                if (flashlight.currentIntensity > 1) {
                    flashlight.decreaseIntensity()
                } else {
                    flashlight.turnOff()
                }
                Log.d(TAG, "Intensity down: ${flashlight.currentIntensity}")
            }
            "com.flashlight.ACTION_SET_INTENSITY" -> {
                val level = intent.getIntExtra("intensity", 5)
                flashlight.setIntensity(level)
                Log.d(TAG, "Set intensity: $level")
            }
        }

        // Update the notification and broadcast state change
        val serviceIntent = Intent(context, FlashlightService::class.java).apply {
            action = FlashlightService.ACTION_UPDATE
        }
        context.startService(serviceIntent)

        // Broadcast state change for MainActivity and TileService to react
        val broadcastIntent = Intent("com.flashlight.STATE_CHANGED").apply {
            setPackage(context.packageName)
        }
        context.sendBroadcast(broadcastIntent)
    }

    companion object {
        private const val TAG = "NotificationReceiver"
    }
}
