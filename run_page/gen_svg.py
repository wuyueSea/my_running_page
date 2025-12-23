import argparse
import logging
import os
import sys

from config import SQL_FILE
from gpxtrackposter import (
    circular_drawer,
    github_drawer,
    grid_drawer,
    poster,
    track_loader,
    month_of_life_drawer,
)
from gpxtrackposter.exceptions import ParameterError, PosterError

__app_name__ = "create_poster"
__app_author__ = "flopp.net"


def main():
    """Handle command line arguments and call other modules as needed."""

    p = poster.Poster()
    drawers = {
        "grid": grid_drawer.GridDrawer(p),
        "circular": circular_drawer.CircularDrawer(p),
        "github": github_drawer.GithubDrawer(p),
        "monthoflife": month_of_life_drawer.MonthOfLifeDrawer(p),
    }

    args_parser = argparse.ArgumentParser()
    # 基础路径/输出配置
    args_parser.add_argument(
        "--gpx-dir",
        dest="gpx_dir",
        metavar="DIR",
        type=str,
        default=".",
        help="Directory containing GPX files (default: current directory).",
    )
    args_parser.add_argument(
        "--output",
        metavar="FILE",
        type=str,
        default="poster.svg",
        help='Name of generated SVG image file (default: "poster.svg").',
    )
    # 语言/时间/过滤配置
    args_parser.add_argument(
        "--language",
        metavar="LANGUAGE",
        type=str,
        default="",
        help="Language (default: english).",
    )
    args_parser.add_argument(
        "--year",
        metavar="YEAR",
        type=str,
        default="all",
        help='Filter tracks by year; "NUM", "NUM-NUM", "all" (default: all years)',
    )
    args_parser.add_argument(
        "--use-localtime",
        dest="use_localtime",
        action="store_true",
        help="Use local time instead of UTC (default: UTC).",
    )
    # 标题/运动员配置
    args_parser.add_argument(
        "--title", metavar="TITLE", type=str, help="Title to display."
    )
    args_parser.add_argument(
        "--athlete",
        metavar="NAME",
        type=str,
        default="John Doe",
        help='Athlete name to display (default: "John Doe").',
    )
    # 特殊轨迹标记
    args_parser.add_argument(
        "--special",
        metavar="FILE",
        action="append",
        default=[],
        help="Mark track file from the GPX directory as special; use multiple times for multiple tracks.",
    )
    # 海报类型
    types = '", "'.join(drawers.keys())
    args_parser.add_argument(
        "--type",
        metavar="TYPE",
        default="grid",
        choices=drawers.keys(),
        help=f'Type of poster to create (default: "grid", available: "{types}").',
    )
    # 颜色配置（修正引号冲突+统一十六进制默认值）
    args_parser.add_argument(
        "--background-color",
        dest="background_color",
        metavar="COLOR",
        type=str,
        default="#222222",
        help='Background color of poster (default: "#222222").',
    )
    args_parser.add_argument(
        "--track-color",
        dest="track_color",
        metavar="COLOR",
        type=str,
        default="#4DD2FF",
        help='Color of normal tracks (default: "#4DD2FF").',
    )
    args_parser.add_argument(
        "--track-color2",
        dest="track_color2",
        metavar="COLOR",
        type=str,
        help="Secondary color of normal tracks (default: same as track-color).",
    )
    args_parser.add_argument(
        "--text-color",
        dest="text_color",
        metavar="COLOR",
        type=str,
        default="#FFFFFF",
        help='Color of text (default: "#FFFFFF").',
    )
    # 三级特殊距离+颜色（修正引号+明确默认值）
    args_parser.add_argument(
        "--special-color",
        dest="special_color",
        metavar="COLOR",
        default="#3070F3",  # 10-20km：天蓝色（直接设为目标默认值）
        help='Color for 10-20km tracks (default: "#3070F3").',
    )
    args_parser.add_argument(
        "--special-color2",
        dest="special_color2",
        metavar="COLOR",
        default="#FFFF00",  # 20-40km：黄色
        help='Color for 20-40km tracks (default: "#FFFF00").',
    )
    args_parser.add_argument(
        "--special-color3",
        dest="special_color3",
        metavar="COLOR",
        default="#FF0000",  # 40km+：红色
        help='Color for ≥40km tracks (default: "#FF0000").',
    )
    # 单位/过滤配置
    args_parser.add_argument(
        "--units",
        dest="units",
        metavar="UNITS",
        type=str,
        choices=["metric", "imperial"],
        default="metric",
        help='Distance units; "metric", "imperial" (default: "metric").',
    )
    args_parser.add_argument(
        "--min-distance",
        dest="min_distance",
        metavar="DISTANCE",
        type=float,
        default=1.0,
        help="Minimum track distance (km) to include (default: 1.0).",
    )
    # 三级特殊距离阈值（km）
    args_parser.add_argument(
        "--special-distance",
        dest="special_distance",
        metavar="DISTANCE",
        type=float,
        default=10.0,
        help="Threshold for 10-20km special color (default: 10.0 km).",
    )
    args_parser.add_argument(
        "--special-distance2",
        dest="special_distance2",
        metavar="DISTANCE",
        type=float,
        default=21.1,
        help="Threshold for 21.1-42.2km special color (default: 21.1 km).",
    )
    args_parser.add_argument(
        "--special-distance3",
        dest="special_distance3",
        metavar="DISTANCE",
        type=float,
        default=42.2,
        help="Threshold for ≥42.2km special color (default: 42.2 km).",
    )
    # 数据库/样式配置
    args_parser.add_argument(
        "--from-db",
        dest="from_db",
        action="store_true",
        help="Load activities from database (instead of GPX files).",
    )
    args_parser.add_argument(
        "--github-style",
        dest="github_style",
        metavar="STYLE",
        type=str,
        default="align-firstday",
        help='GitHub SVG style; "align-firstday", "align-monday" (default: "align-firstday").',
    )
    args_parser.add_argument(
        "--sport-type",
        dest="sport_type",
        metavar="TYPE",
        type=str,
        default="all",
        help="Filter tracks by sport type (default: all).",
    )
    # 日志配置
    args_parser.add_argument(
        "--verbose", dest="verbose", action="store_true", help="Enable verbose logging."
    )
    args_parser.add_argument("--logfile", dest="logfile", metavar="FILE", type=str, help="Log file path.")

    # 给每个drawer添加自定义参数
    for _, drawer in drawers.items():
        drawer.create_args(args_parser)

    # 解析参数
    args = args_parser.parse_args()

    # 传递参数给drawer
    for _, drawer in drawers.items():
        drawer.fetch_args(args)

    # 日志配置
    log = logging.getLogger("gpxtrackposter")
    log.setLevel(logging.INFO if args.verbose else logging.ERROR)
    if args.logfile:
        log.addHandler(logging.FileHandler(args.logfile))

    # 加载轨迹数据
    loader = track_loader.TrackLoader()
    loader.use_local_time = args.use_localtime
    if not loader.year_range.parse(args.year):
        raise ParameterError(f"Invalid year range: {args.year}")
    loader.special_file_names = args.special
    loader.min_length = args.min_distance * 1000  # 转米

    # 从数据库/GPX加载轨迹
    if args.from_db:
        tracks = loader.load_tracks_from_db(SQL_FILE, args.type == "grid")
    else:
        tracks = loader.load_tracks(args.gpx_dir)

    # 过滤运动类型
    if args.sport_type != "all":
        tracks = [t for t in tracks if t.type == args.sport_type]
    if not tracks:
        log.warning("No tracks found to generate poster!")
        return

    # 海报基础配置
    p.set_language(args.language)
    p.athlete = args.athlete
    p.title = args.title or p.trans("MY TRACKS")
    p.units = args.units
    p.github_style = args.github_style
    p.drawer_type = "plain" if args.type == "circular" else ("monthoflife" if args.type == "monthoflife" else "title")

    # 关键：传递三级特殊距离（原脚本只传了前两级，补充第三级）
    p.special_distance = {
        "special_distance": args.special_distance,
        "special_distance2": args.special_distance2,
        "special_distance3": args.special_distance3,  # 新增第三级
    }

    # 颜色字典（确保special3生效，兜底逻辑优化）
    p.colors = {
        "background": args.background_color,
        "track": args.track_color,
        "track2": args.track_color2 or args.track_color,
        "special": args.special_color,
        "special2": args.special_color2 or args.special_color,
        "special3": args.special_color3 or args.special_color2,  # 兜底：无red则用yellow
        "text": args.text_color,
    }

    # 特殊处理circular类型的默认颜色
    if args.type == "circular":
        p.colors["background"] = args.background_color if args.background_color != "#222222" else "#1a1a1a"
        p.colors["track"] = args.track_color if args.track_color != "#4DD2FF" else "red"
        p.colors["special"] = args.special_color if args.special_color != "#87CEEB" else "yellow"
        p.colors["text"] = args.text_color if args.text_color != "#FFFFFF" else "#e1ed5e"

    # 设置轨迹并绘制
    p.set_tracks(tracks)
    if args.type == "circular":
        # 按年份拆分生成circular海报
        years = p.years.all()[:]
        output_dir = os.path.dirname(args.output) or "assets"
        for year in years:
            p.years.from_year = p.years.to_year = year
            p.set_tracks(tracks)
            p.draw(drawers[args.type], os.path.join(output_dir, f"year_{year}.svg"))
    else:
        # 生成普通海报（grid/github/monthoflife）
        log.info(f"Generating {args.type} poster with {len(tracks)} tracks -> {args.output}")
        p.draw(drawers[args.type], args.output)


if __name__ == "__main__":
    try:
        main()
    except PosterError as e:
        print(f"Error generating poster: {e}")
        sys.exit(1)
    except ParameterError as e:
        print(f"Invalid parameter: {e}")
        sys.exit(1)
