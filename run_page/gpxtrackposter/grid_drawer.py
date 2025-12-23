"""Draw a grid poster."""

# Copyright 2016-2019 Florian Pigorsch & Contributors. All rights reserved.
#
# Use of this source code is governed by a MIT-style
# license that can be found in the LICENSE file.

import svgwrite

from .exceptions import PosterError
from .poster import Poster
from .track import Track
from .tracks_drawer import TracksDrawer
from .utils import compute_grid, format_float, project
from .xy import XY


class GridDrawer(TracksDrawer):
    """Drawer used to draw a grid poster

    Methods:
        draw: For each track, draw it on the poster.
    """

    def __init__(self, the_poster: Poster):
        super().__init__(the_poster)

    def draw(self, dr: svgwrite.Drawing, size: XY, offset: XY):
        """For each track, draw it on the poster."""
        if self.poster.tracks is None:
            raise PosterError("No tracks to draw.")
        cell_size, counts = compute_grid(len(self.poster.tracks), size)
        if cell_size is None or counts is None:
            raise PosterError("Unable to compute grid.")
        count_x, count_y = counts[0], counts[1]
        spacing_x = (
            0 if count_x <= 1 else (size.x - cell_size * count_x) / (count_x - 1)
        )
        spacing_y = (
            0 if count_y <= 1 else (size.y - cell_size * count_y) / (count_y - 1)
        )
        offset.x += (size.x - count_x * cell_size - (count_x - 1) * spacing_x) / 2
        offset.y += (size.y - count_y * cell_size - (count_y - 1) * spacing_y) / 2
        for index, tr in enumerate(self.poster.tracks[::-1]):
            p = XY(index % count_x, index // count_x) * XY(
                cell_size + spacing_x, cell_size + spacing_y
            )
            self._draw_track(
                dr,
                tr,
                0.9 * XY(cell_size, cell_size),
                offset + 0.05 * XY(cell_size, cell_size) + p,
            )

    def _draw_track(self, dr: svgwrite.Drawing, tr: Track, size: XY, offset: XY):
        # 1. 提取三级特殊距离阈值（km，从poster中获取）
        distance1 = self.poster.special_distance["special_distance"]  # 10km
        distance2 = self.poster.special_distance["special_distance2"]  # 20km
        distance3 = self.poster.special_distance["special_distance3"]  # 40km

        # 2. 计算轨迹距离（转km，原单位是米）
        track_distance_km = tr.length / 1000

        # 3. 按「从大到小」判断距离区间，匹配对应颜色（核心修正）
        # 优先级：40km+ > 20-40km > 10-20km > 普通轨迹
        if track_distance_km >= distance3:
            # ≥40km：使用special3颜色（红色），兜底用special2（黄色）
            color = self.poster.colors.get("special3") or self.poster.colors.get("special2")
        elif track_distance_km >= distance2:
            # 20-40km：使用special2颜色（黄色），兜底用special（天蓝）
            color = self.poster.colors.get("special2") or self.poster.colors.get("special")
        elif track_distance_km >= distance1:
            # 10-20km：使用special颜色（天蓝），兜底用默认轨迹色
            color = self.poster.colors.get("special") or self.color(
                self.poster.length_range, tr.length, tr.special
            )
        else:
            # <10km：使用默认轨迹色
            color = self.color(self.poster.length_range, tr.length, tr.special)

        # 4. 轨迹标题（日期+距离）
        str_length = format_float(self.poster.m2u(tr.length))
        date_title = f"{str(tr.start_time_local)[:10]} {str_length}km"

        # 5. 绘制轨迹polyline（保留原有绘制逻辑，仅颜色已提前判断）
        for line in project(tr.bbox(), size, offset, tr.polylines):
            polyline = dr.polyline(
                points=line,
                stroke=color,
                fill="none",
                stroke_width=0.5,
                stroke_linejoin="round",
                stroke_linecap="round",
            )
            polyline.set_desc(title=date_title, desc=tr.run_id)
            dr.add(polyline)
