package com.flashlight.app

import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Log

class FlashlightManager(private val context: Context) {

    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    private var cameraId: String? = null
    private var maxLevel: Int = 1

    var isOn: Boolean = false
        private set

    var currentIntensity: Int = 5  // 1–10 scale
        private set

    init {
        try {
            // Find camera with flash
            cameraId = cameraManager.cameraIdList.firstOrNull { id ->
                cameraManager.getCameraCharacteristics(id)
                    .get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }

            // Check max torch strength level (API 33+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && cameraId != null) {
                val chars = cameraManager.getCameraCharacteristics(cameraId!!)
                maxLevel = chars.get(CameraCharacteristics.FLASH_INFO_STRENGTH_MAXIMUM_LEVEL) ?: 1
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
        try {
            cameraId?.let { id ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && maxLevel > 1) {
                    val level = mapIntensityToLevel(currentIntensity)
                    cameraManager.turnOnTorchWithStrengthLevel(id, level)
                } else {
                    cameraManager.setTorchMode(id, true)
                }
                isOn = true
            }
        } catch (e: Exception) {
            Log.e(TAG, "Turn on error: ${e.message}")
        }
    }

    fun turnOff() {
        try {
            cameraId?.let { id ->
                cameraManager.setTorchMode(id, false)
                isOn = false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Turn off error: ${e.message}")
        }
    }

    fun toggle(): Boolean {
        return if (isOn) {
            turnOff()
            false
        } else {
            turnOn()
            true
        }
    }

    fun setIntensity(level: Int) {
        currentIntensity = level.coerceIn(1, 10)
        if (isOn) turnOn(currentIntensity)
    }

    fun increaseIntensity() {
        setIntensity(currentIntensity + 1)
    }

    fun decreaseIntensity() {
        setIntensity(currentIntensity - 1)
    }

    private fun mapIntensityToLevel(intensity: Int): Int {
        // Map 1–10 to 1–maxLevel
        return ((intensity.toFloat() / 10f) * maxLevel).toInt().coerceIn(1, maxLevel)
    }

    companion object {
        private const val TAG = "FlashlightManager"

        @Volatile
        private var instance: FlashlightManager? = null

        fun getInstance(context: Context): FlashlightManager {
            return instance ?: synchronized(this) {
                instance ?: FlashlightManager(context.applicationContext).also { instance = it }
            }
        }
    }
}
