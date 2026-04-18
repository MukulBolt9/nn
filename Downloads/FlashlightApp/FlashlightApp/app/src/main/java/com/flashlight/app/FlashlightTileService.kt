package com.flashlight.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

class FlashlightTileService : TileService() {

    private lateinit var flashlight: FlashlightManager
    private var stateReceiver: BroadcastReceiver? = null

    override fun onCreate() {
        super.onCreate()
        flashlight = FlashlightManager.getInstance(this)
    }

    override fun onStartListening() {
        super.onStartListening()
        updateTile()

        // Listen for state changes from the app or notification
        stateReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                updateTile()
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(
                stateReceiver,
                IntentFilter("com.flashlight.STATE_CHANGED"),
                RECEIVER_NOT_EXPORTED
            )
        } else {
            registerReceiver(stateReceiver, IntentFilter("com.flashlight.STATE_CHANGED"))
        }
    }

    override fun onStopListening() {
        super.onStopListening()
        try {
            stateReceiver?.let { unregisterReceiver(it) }
        } catch (_: Exception) {}
        stateReceiver = null
    }

    override fun onClick() {
        super.onClick()
        flashlight.toggle()

        if (flashlight.isOn) {
            FlashlightService.start(this)
        } else {
            FlashlightService.update(this)
        }

        updateTile()

        // Broadcast state change
        sendBroadcast(Intent("com.flashlight.STATE_CHANGED").apply {
            setPackage(packageName)
        })
    }

    private fun updateTile() {
        val tile = qsTile ?: return
        val isOn = flashlight.isOn
        val intensity = flashlight.currentIntensity

        tile.state = if (isOn) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
        tile.label = "Flashlight"
        tile.contentDescription = if (isOn) "Flashlight on, level $intensity" else "Flashlight off"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            tile.subtitle = if (isOn) "Level $intensity/10" else "Off"
        }

        tile.updateTile()
    }
}
