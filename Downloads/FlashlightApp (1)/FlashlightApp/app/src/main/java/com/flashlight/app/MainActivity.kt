package com.flashlight.app

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.animation.AnimationUtils
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private val TAG = "MainActivity"

    private var flashlight: FlashlightManager? = null
    private var powerButton: ImageButton? = null
    private var intensitySeekBar: SeekBar? = null
    private var intensityLabel: TextView? = null
    private var statusLabel: TextView? = null
    private var intensityCard: LinearLayout? = null
    private var beamOverlay: View? = null
    private var rootLayout: RelativeLayout? = null

    private var stateReceiver: BroadcastReceiver? = null
    private var receiverRegistered = false

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ -> startFlashlightService() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            setContentView(R.layout.activity_main)
            flashlight = FlashlightManager.getInstance(this)
            bindViews()
            setupPowerButton()
            setupIntensityControls()
            refreshUI()
            requestNotificationPermissionAndStart()
        } catch (e: Exception) {
            Log.e(TAG, "onCreate error: ${e.message}", e)
        }
    }

    override fun onResume() {
        super.onResume()
        try { refreshUI(); registerStateReceiver() } catch (e: Exception) { Log.e(TAG, "onResume: ${e.message}") }
    }

    override fun onPause() { super.onPause(); unregisterStateReceiver() }
    override fun onDestroy() { super.onDestroy(); unregisterStateReceiver() }

    private fun registerStateReceiver() {
        if (receiverRegistered) return
        stateReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) { runOnUiThread { refreshUI() } }
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(stateReceiver, IntentFilter("com.flashlight.STATE_CHANGED"), RECEIVER_NOT_EXPORTED)
            } else {
                @Suppress("UnspecifiedRegisterReceiverFlag")
                registerReceiver(stateReceiver, IntentFilter("com.flashlight.STATE_CHANGED"))
            }
            receiverRegistered = true
        } catch (e: Exception) { Log.e(TAG, "registerReceiver: ${e.message}") }
    }

    private fun unregisterStateReceiver() {
        if (!receiverRegistered) return
        try { stateReceiver?.let { unregisterReceiver(it) } } catch (e: Exception) { Log.e(TAG, "unregister: ${e.message}") }
        finally { receiverRegistered = false; stateReceiver = null }
    }

    private fun bindViews() {
        powerButton = findViewById(R.id.powerButton)
        intensitySeekBar = findViewById(R.id.intensitySeekBar)
        intensityLabel = findViewById(R.id.intensityLabel)
        statusLabel = findViewById(R.id.statusLabel)
        intensityCard = findViewById(R.id.intensityCard)
        beamOverlay = findViewById(R.id.beamOverlay)
        rootLayout = findViewById(R.id.rootLayout)
    }

    private fun setupPowerButton() {
        powerButton?.setOnClickListener {
            try {
                powerButton?.startAnimation(AnimationUtils.loadAnimation(this, R.anim.pulse))
                flashlight?.toggle()
                FlashlightService.update(this)
                sendStateBroadcast()
                refreshUI()
            } catch (e: Exception) { Log.e(TAG, "toggle error: ${e.message}") }
        }
    }

    private fun setupIntensityControls() {
        val seekBar = intensitySeekBar ?: return
        seekBar.max = 9
        seekBar.progress = (flashlight?.currentIntensity ?: 5) - 1
        seekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(sb: SeekBar?, progress: Int, fromUser: Boolean) {
                val level = progress + 1
                intensityLabel?.text = "Intensity: $level/10"
                if (fromUser) {
                    try {
                        flashlight?.setIntensity(level)
                        FlashlightService.update(this@MainActivity)
                        sendStateBroadcast()
                        beamOverlay?.alpha = (level / 10f) * 0.85f
                    } catch (e: Exception) { Log.e(TAG, "seekbar error: ${e.message}") }
                }
            }
            override fun onStartTrackingTouch(sb: SeekBar?) {}
            override fun onStopTrackingTouch(sb: SeekBar?) {}
        })
    }

    private fun refreshUI() {
        val fl = flashlight ?: return
        val isOn = fl.isOn
        val intensity = fl.currentIntensity
        powerButton?.setImageResource(if (isOn) R.drawable.ic_power_on else R.drawable.ic_power_off)
        rootLayout?.setBackgroundResource(if (isOn) R.drawable.bg_on else R.drawable.bg_off)
        statusLabel?.text = if (isOn) "ON" else "OFF"
        statusLabel?.setTextColor(if (isOn) getColor(R.color.amber_400) else getColor(R.color.text_dim))
        intensitySeekBar?.progress = intensity - 1
        intensityLabel?.text = "Intensity: $intensity/10"
        beamOverlay?.visibility = if (isOn) View.VISIBLE else View.GONE
        beamOverlay?.alpha = if (isOn) (intensity / 10f) * 0.85f else 0f
        intensitySeekBar?.isEnabled = isOn
        intensitySeekBar?.alpha = if (isOn) 1f else 0.4f
    }

    private fun sendStateBroadcast() {
        sendBroadcast(Intent("com.flashlight.STATE_CHANGED").apply { setPackage(packageName) })
    }

    private fun requestNotificationPermissionAndStart() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
                startFlashlightService()
            } else {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        } else {
            startFlashlightService()
        }
    }

    private fun startFlashlightService() {
        try { FlashlightService.start(this) } catch (e: Exception) { Log.e(TAG, "service start: ${e.message}") }
    }
}
