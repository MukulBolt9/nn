package com.nowbrief.activities

import android.os.Bundle
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView
import com.facebook.react.common.LifecycleState
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.nowbrief.R

/**
 * NowBriefActivity - Dedicated activity that opens when user taps
 * the Samsung Live Notification / Now Bar chip.
 *
 * This is a full-screen immersive activity showing the complete NowBrief
 * dashboard with weather, news, and AI summary.
 */
class NowBriefActivity : AppCompatActivity(), DefaultHardwareBackBtnHandler {

    private var reactRootView: ReactRootView? = null
    private var reactInstanceManager: ReactInstanceManager? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Allow showing over lock screen
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        // Set immersive full screen
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Use dedicated layout for NowBrief
        setContentView(R.layout.activity_nowbrief)
    }

    override fun invokeDefaultOnBackPressed() {
        super.onBackPressed()
    }

    override fun onResume() {
        super.onResume()
        reactInstanceManager?.onHostResume(this, this)
    }

    override fun onPause() {
        super.onPause()
        reactInstanceManager?.onHostPause(this)
    }

    override fun onDestroy() {
        super.onDestroy()
        reactInstanceManager?.onHostDestroy(this)
        reactRootView?.unmountReactApplication()
    }
}
