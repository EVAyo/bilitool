package com.yrc.util

object ApiUitl {
    val suitDetailApi = "https://api.bilibili.com/x/garb/mall/item/suit/v2"
    val suitListApi = "https://www.bilibili.com/h5/mall/home"
    private val suitDetailKey = "item_id"
    fun suitDetailParam(suitId: String): Map<String, String> {
        return mapOf(suitDetailKey to suitId)
    }
    fun suitDetailParamMethod(): (Map<String, String>) -> String {
        return { it[suitDetailKey].orEmpty() }
    }
}