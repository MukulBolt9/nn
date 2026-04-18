package com.flashlight.app

import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Log

class FlashlightManager private constructor(private val context: Context) {

    private val TAG = "FlashlightManager"
    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    private var cameraId: String? = null
    private var maxLevel: Int = 1

    var isOn: Boolean = false
        private set

    var currentIntensity: Int = 5
        private set

    init {
        try {
            cameraId = cameraManager.cameraIdList.firstOrNull { id ->
                try {
                    cameraManager.getCameraCharacteristics(id)
                        .get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
                } catch (e: Exception) { false }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && cameraId != null) {
                try {
                    val chars = cameraManager.getCameraCharacteristics(cameraId!!)
                    maxLevel = chars.get(CameraCharacteristics.FLASH_INFO_STRENGTH_MAXIMUM_LEVEL) ?: 1
                } catch (e: Exception) {
                    maxLevel = 1
                }
            }
            Log.d(TAG, "Camera ID: $cameraId, maxLevel: $maxLevel")
        } catch (e: Exception) {
            Log.e(TAG, "Init error: ${e.message}")
        }
    }

    fun supportsIntensity(): Boolean =
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && maxLevel > 1

    fun turnOn(intensity: Int = currentIntensity) {
        currentIntensity = intensity.coerceIn(1, 10)
        val id = cameraId ?: return
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && maxLevel > 1) {
                val level = mapIntensityToLevel(currentIntensity)
                cameraManager.turnOnTorchWithStrengthLevel(id, level)
            } else {
                cameraManager.setTorchMode(id, true)
            }
            isOn = true
            Log.d(TAG, "Torch ON, intensity=$currentIntensity")
        } catch (e: Exception) {
            Log.e(TAG, "turnOn error: ${e.message}")
            // Fallback: try basic torch
            try {
                cameraManager.setTorchMode(id, true)
                isOn = true
            } catch (e2: Exception) {
                Log.e(TAG, "turnOn fallback error: ${e2.message}")
            }
        }
    }

    fun turnOff() {
        val id = cameraId ?: return
        try {
            cameraManager.setTorchMode(id, false)
            isOn = false
            Log.d(TAG, "Torch OFF")
        } catch (e: Exception) {
            Log.e(TAG, "turnOff error: ${e.message}")
        }
    }

    fun toggle(): Boolean {
        return if (isOn) { turnOff(); false } else { turnOn(); true }
    }

    fun setIntensity(level: Int) {
        currentIntensity = level.coerceIn(1, 10)
        if (isOn) turnOn(currentIntensity)
    }

    fun increaseIntensity() { setIntensity(currentIntensity + 1) }
    fun decreaseIntensity() { setIntensity(currentIntensity - 1) }

    private fun mapIntensityToLevel(intensity: Int): Int =
        ((intensity.toFloat() / 10f) * maxLevel).toInt().coerceIn(1, maxLevel)

    companion object {
        private const val TAG = "FlashlightManager"

        @Volatile private var instance: FlashlightManager? = null

        fun getInstance(context: Context): FlashlightManager =
            instance ?: synchronized(this) {
                instance ?: FlashlightManager(context.applicationContext).also { instance = it }
            }
    }
}
