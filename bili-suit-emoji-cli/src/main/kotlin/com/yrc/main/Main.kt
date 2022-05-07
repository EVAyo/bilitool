package com.yrc.main

import com.yrc.converter.BiliSuitDetailConverter
import com.yrc.converter.BiliSuitListConverter
import com.yrc.util.ApiUitl
import com.yrc.utils.ImageDownloader
import org.apache.commons.cli.BasicParser
import org.apache.commons.cli.CommandLine
import org.apache.commons.cli.CommandLineParser
import org.apache.commons.cli.HelpFormatter
import org.apache.commons.cli.MissingArgumentException
import org.apache.commons.cli.Options
import org.apache.commons.cli.ParseException


fun main (args: Array<String>) {
    val commandLine: CommandLine = Main.initArgs(args) ?: return
    val helpFormatter = HelpFormatter()

    if (commandLine.hasOption("a")) {
        println("暂未完成")
        return
    }

    if (commandLine.hasOption("l")) {
        BiliSuitListConverter(ApiUitl.suitListApi).run {
            printItemList(getItems())
        }
        return
    } else if (commandLine.hasOption("f")) {
        BiliSuitListConverter(ApiUitl.suitListApi).run {
            printItemList(getRegexItemList(commandLine.getOptionValue("f")))
        }
        return
    }

    var dirPath: String = if (commandLine.hasOption("d")) {
        commandLine.getOptionValue("d")
    } else if (commandLine.hasOption("i")){
        "./${commandLine.getOptionValue("i")}"
    } else {
        helpFormatter.printHelp("bili套装表情下载器", Main.options)
        return
    }
    val itemId: String = if(commandLine.hasOption("i")) {
        commandLine.getOptionValue("i")
    } else {
        helpFormatter.printHelp("bili套装表情下载器", Main.options)
        return
    }

    ImageDownloader(
        BiliSuitDetailConverter(ApiUitl.suitDetailApi)
            .getItemList(ApiUitl.suitDetailParam(itemId),
                ApiUitl.suitDetailParamMethod()),
        dirPath).startDownload()
}

object Main {
    var options = Options()

    fun initArgs(args: Array<String>?): CommandLine? {
        val helpFormatter = HelpFormatter()
        with(options) {
            addOption("h", "help", false, "将此帮助消息输出到输出流")
            addOption("l", "list", false, "获取套装列表")
            addOption("i", "id", true, "待爬取的主题item_id（即分享链接后的item_id的值）")
            addOption("a", "all", false, "爬取所有套装")
            addOption("f", "find", true, "搜索套装id")
            addOption("d", "directory", true, "指定放置生成的类文件的位置")
        }
        return try {
            val parser: CommandLineParser = BasicParser()
            parser.parse(options, args)
        } catch (e: MissingArgumentException) {
            println("参数不完整")
            helpFormatter.printHelp("bili套装表情下载器", options)
            null
        } catch (e: ParseException) {
            println("参数解析失败")
            helpFormatter.printHelp("bili套装表情下载器", options)
            null
        }
    }
}
