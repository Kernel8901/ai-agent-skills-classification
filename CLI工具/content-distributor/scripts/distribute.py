#!/usr/bin/env python3
"""
批量内容分发工具
用法: python3 distribute.py --platforms zhihu,douban --title "..." --content-file content.md
"""

import argparse
import sys
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from platforms import get_platform, list_platforms, PlatformError


def distribute_content(platforms: list, title: str, content: str, post_types: dict = None) -> dict:
    """
    将内容分发到多个平台
    
    Args:
        platforms: 目标平台列表
        title: 内容标题
        content: 内容正文
        post_types: 每个平台的发布类型，如 {"zhihu": "article", "douban": "diary"}
    
    Returns:
        分发结果
    """
    # 默认发布类型
    default_types = {
        "zhihu": "article",
        "douban": "diary",
        "weibo": "status",
    }
    
    if post_types is None:
        post_types = {}
    
    results = {
        "timestamp": datetime.now().isoformat(),
        "title": title,
        "platforms": {},
        "success_count": 0,
        "fail_count": 0,
    }
    
    for platform_name in platforms:
        print(f"\n📤 正在发布到 {platform_name}...")
        
        try:
            platform = get_platform(platform_name)
            post_type = post_types.get(platform_name, default_types.get(platform_name, "article"))
            
            kwargs = {"content": content}
            if title:
                kwargs["title"] = title
            
            result = platform.post(post_type, **kwargs)
            
            results["platforms"][platform_name] = {
                "success": True,
                "type": post_type,
                "url": result.get("url", ""),
            }
            results["success_count"] += 1
            print(f"   ✅ 成功: {result.get('url', '已发布')}")
            
        except PlatformError as e:
            results["platforms"][platform_name] = {
                "success": False,
                "error": str(e),
            }
            results["fail_count"] += 1
            print(f"   ❌ 失败: {e}")
    
    return results


def main():
    parser = argparse.ArgumentParser(description="批量内容分发工具")
    parser.add_argument("--platforms", "-p", required=True,
                        help="目标平台，逗号分隔 (zhihu,douban,weibo)")
    parser.add_argument("--title", "-t", help="内容标题")
    parser.add_argument("--content", "-c", help="内容正文")
    parser.add_argument("--content-file", "-f", help="从文件读取内容")
    parser.add_argument("--types", help="发布类型，格式: zhihu:article,douban:diary")
    parser.add_argument("--output", "-o", help="保存结果到 JSON 文件")
    parser.add_argument("--dry-run", action="store_true", help="仅验证，不实际发布")
    
    args = parser.parse_args()
    
    # 解析平台列表
    platforms = [p.strip() for p in args.platforms.split(",")]
    
    # 解析发布类型
    post_types = {}
    if args.types:
        for item in args.types.split(","):
            if ":" in item:
                platform, ptype = item.split(":", 1)
                post_types[platform.strip()] = ptype.strip()
    
    # 获取内容
    content = args.content
    if args.content_file:
        with open(args.content_file, 'r', encoding='utf-8') as f:
            content = f.read()
    
    if not content:
        print("❌ 错误: 必须提供 --content 或 --content-file")
        sys.exit(1)
    
    title = args.title or ""
    
    # 干运行
    if args.dry_run:
        print("🔍 干运行模式")
        print(f"   平台: {platforms}")
        print(f"   标题: {title}")
        print(f"   内容长度: {len(content)} 字符")
        print(f"   发布类型: {post_types or '默认'}")
        
        print("\n验证凭据...")
        for platform_name in platforms:
            try:
                platform = get_platform(platform_name)
                if platform.validate_credentials():
                    print(f"   ✅ {platform_name}: 凭据有效")
            except PlatformError as e:
                print(f"   ❌ {platform_name}: {e}")
        return
    
    # 执行分发
    print(f"🚀 开始分发内容到 {len(platforms)} 个平台...")
    results = distribute_content(platforms, title, content, post_types)
    
    # 输出结果
    print(f"\n📊 分发完成: {results['success_count']} 成功, {results['fail_count']} 失败")
    
    # 保存结果
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"   结果已保存到: {args.output}")


if __name__ == "__main__":
    main()
