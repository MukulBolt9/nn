package com.flashlight.app

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.animation.AnimationUtils
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var flashlight: FlashlightManager

    // Views
    private lateinit var powerButton: ImageButton
    private lateinit var intensitySeekBar: SeekBar
    private lateinit var intensityLabel: TextView
    private lateinit var statusLabel: TextView
    private lateinit var intensityCard: android.widget.LinearLayout
    private lateinit var beamOverlay: android.view.View

    private var stateReceiver: BroadcastReceiver? = null

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            startFlashlightService()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        flashlight = FlashlightManager.getInstance(this)

        bindViews()
        setupIntensityControls()
        setupPowerButton()
        refreshUI()

        // Start service (it manages the notification)
        requestNotificationPermissionAndStart()
    }

    override fun onResume() {
        super.onResume()
        refreshUI()

        // Register receiver for state changes from notification/tile
        stateReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                runOnUiThread { refreshUI() }
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

    override fun onPause() {
        super.onPause()
        try { stateReceiver?.let { unregisterReceiver(it) } } catch (_: Exception) {}
    }

    private fun bindViews() {
        powerButton = findViewById(R.id.powerButton)
        intensitySeekBar = findViewById(R.id.intensitySeekBar)
        intensityLabel = findViewById(R.id.intensityLabel)
        statusLabel = findViewById(R.id.statusLabel)
        intensityCard = findViewById(R.id.intensityCard)
        beamOverlay = findViewById(R.id.beamOverlay)
    }

    private fun setupPowerButton() {
        powerButton.setOnClickListener {
            val anim = AnimationUtils.loadAnimation(this, R.anim.pulse)
            powerButton.startAnimation(anim)

            flashlight.toggle()
            FlashlightService.update(this)

            // Broadcast state change
            sendBroadcast(Intent("com.flashlight.STATE_CHANGED").apply {
                setPackage(packageName)
            })

            refreshUI()
        }
    }

    private fun setupIntensityControls() {
        intensitySeekBar.max = 9  // 0-9 representing 1-10
        intensitySeekBar.progress = flashlight.currentIntensity - 1

        intensitySeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                val level = progress + 1
                intensityLabel.text = "Intensity: $level/10"
                if (fromUser) {
                    flashlight.setIntensity(level)
                    FlashlightService.update(this@MainActivity)
                    sendBroadcast(Intent("com.flashlight.STATE_CHANGED").apply {
                        setPackage(packageName)
                    })
                    updateBeamOpacity(level)
                }
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        // Show intensity controls only on devices that support it, or show as visual feedback
        intensityCard.visibility = android.view.View.VISIBLE
    }

    private fun refreshUI() {
        val isOn = flashlight.isOn
        val intensity = flashlight.currentIntensity

        // Power button icon
        powerButton.setImageResource(
            if (isOn) R.drawable.ic_power_on else R.drawable.ic_power_off
        )

        // Background
        val rootLayout = findViewById<android.widget.RelativeLayout>(R.id.rootLayout)
        rootLayout.setBackgroundResource(
            if (isOn) R.drawable.bg_on else R.drawable.bg_off
        )

        // Status
        statusLabel.text = if (isOn) "ON" else "OFF"
        statusLabel.setTextColor(
            if (isOn) getColor(R.color.amber_400) else getColor(R.color.text_dim)
        )

        // Intensity slider
        intensitySeekBar.progress = intensity - 1
        intensityLabel.text = "Intensity: $intensity/10"

        // Beam overlay
        beamOverlay.visibility = if (isOn) android.view.View.VISIBLE else android.view.View.GONE
        updateBeamOpacity(if (isOn) intensity else 0)

        // Seekbar enabled state
        intensitySeekBar.isEnabled = isOn
        intensitySeekBar.alpha = if (isOn) 1f else 0.4f
    }

    private fun updateBeamOpacity(intensity: Int) {
        beamOverlay.alpha = (intensity / 10f) * 0.85f
    }

    private fun requestNotificationPermissionAndStart() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this, Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
            ) {
                startFlashlightService()
            } else {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        } else {
            startFlashlightService()
        }
    }

    private fun startFlashlightService() {
        FlashlightService.start(this)
    }
}
