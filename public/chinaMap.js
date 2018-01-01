;
(function(window) {
    function factory() {

        var ChinaMap = function(opt) {
            var defaultOpt = {
                data: '', // 展示数据
                container: 'body',  // 放置地图的容器
                legend: '', // tooltip中可以加数据注释
                width: 700, // 宽
                height: 450, // 高
                scale: 500, // 缩放
                center: [107, 38], //经纬度中心
                bgColor: "#cbd4dd", // 填充背景色
                borderColor: "#fff", // 填充边框色
                hoverColor: "#ffaf57", // 各省鼠标hover时的背景色
                tooltip: { // 提示框
                    bgColor: "rgba(0,0,0,.8)", // 提示框背景色
                    fontSize: "12px", // 提示框文字大小
                    color: "#fff" // 提示框文字颜色
                },
                southSea: { // 南海
                    borderColor: "#999", // 南海边框颜色
                    x: 520, // 南海部分的X轴距离
                    y: 310 // 南海部分的Y轴距离
                },
                gradient: { // 渐变
                    startColor: "#aadcff", // 渐变开始颜色 
                    endColor: "#0050a2", // 渐变结束颜色
                    textColor: "#666", // 渐变文字颜色
                    fontSize: "12px", // 渐变文字大小
                    textAnchor: "middle", // 渐变文字位置
                    x: 30, // 渐变色块X轴位置
                    y: 390, // 渐变色块Y轴位置
                    width: 140, // 渐变色块宽
                    height: 20 // 渐变色块高
                },
                isShowLinearGradient: false, // 是否显示渐变图例
                isShowSouthSea: false,  // 是否显示南海
                chinaGeoUrl: 'china.geojson',
                isShowProvince: false,  // 是否显示省级详细地图
                provinceData: [], // 省辖市的数据
                provinceMapUrl: 'geoProvince/', // 省级地图的根路径
                provinceWidth: 700,  // 省级地图的宽
                provinceHeight: 450  // 省级地图的高
            };

            this.conf = this._extends(defaultOpt, opt);

            this.init();
        };

        ChinaMap.prototype = {
            constructor: ChinaMap,
            _extends: function(defaultOpt, opt) {
                for (var key in defaultOpt) {
                    if (this._isJson(opt[key])) {
                        this._extends(defaultOpt[key], opt[key]);
                    } else {
                        if (opt[key]) {
                            defaultOpt[key] = opt[key];
                        }
                    }
                }
                return defaultOpt;
            },
            _isJson: function(obj) {
                if (obj instanceof Object) {
                    if (obj instanceof Array || obj instanceof Function) {
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    return false;
                }
            },
            init: function() {
                var that = this;
                var opts = that.conf;
                var width = opts.width;
                var height = opts.height;

                d3.selectAll(opts.container + " svg.chinaMap_D3").remove();

                var projection = d3.geo.mercator()
                    .center(opts.center)
                    .scale(opts.scale)
                    .translate([width / 2, height / 2]);

                var path = d3.geo.path()
                    .projection(projection);

                d3.json(opts.chinaGeoUrl, function(error, root) {

                    if (error) {
                        return console.error(error);
                    }
                    // 处理数据
                    var values = [];
                    for (var i = 0; i < opts.data.length; i++) {
                        var name = opts.data[i].name;
                        var value = opts.data[i].value;
                        values[name] = value;
                    }

                    // 根据数据配置相应的颜色
                    var maxvalue = d3.max(opts.data, function(d) { return d.value; });
                    var minvalue = 0;
                    var linear = d3.scale.linear()
                        .domain([minvalue, maxvalue])
                        .range([0, 1]);
                    var a = d3.rgb(opts.gradient.startColor);
                    var b = d3.rgb(opts.gradient.endColor);
                    var computeColor = d3.interpolate(a, b);

                    // tooltip提示框
                    var tooltip = d3.select(opts.container).append('div')
                        .attr('class', 'tooltip')
                        .attr('opacity', 0.0)
                        .style('background', opts.tooltip.bgColor)
                        .style('font-size', opts.tooltip.fontSize)
                        .style('color', opts.tooltip.color)
                        .style('padding', '10px')
                        .style('border-radius', '3px')
                        .style('position', 'absolute')
                        .style('opacity', 0.0);

                    d3.select(opts.container).append("svg")
                        .attr("class", "chinaMap_D3")
                        .attr("width", width)
                        .attr("height", height)
                        .attr("fill", opts.bgColor)
                        .append("g")
                        .attr("transform", "translate(0,0)")
                        .selectAll("path")
                        .data(root.features)
                        .enter()
                        .append("path")
                        .attr("stroke", opts.borderColor)
                        .attr("stroke-width", 1)
                        .attr("d", path)
                        .attr("fill", function(d, i) {
                            return computeColor(linear(values[d.properties.name]));
                        })
                        .on("click", function (d, i){
                            var curProvinceInfo = that.matchProvinceName(d.properties.name);

                            if(opts.isShowProvince && opts.provinceData){
                                var opt = {
                                    data: opts.provinceData,
                                    container: '.provinceMap',
                                    chinaGeoUrl: curProvinceInfo.provinceMap,
                                    scale: curProvinceInfo.scale,
                                    center: curProvinceInfo.center,
                                    width: opts.provinceWidth,
                                    height: opts.provinceHeight
                                }
                                new ChinaMap(opt);
                            }
                        })
                        .on("mouseover", function(d, i) {
                            d3.select(this)
                                .attr("fill", opts.hoverColor);

                            var curName = d.properties.name;
                            var curValue = '-';
                            for (var j = 0; j < opts.data.length; j++) {
                                if (opts.data[j].name == curName) {
                                    curValue = opts.data[j].value;
                                }
                            }

                            tooltip.html(opts.legend + curName + ': ' + curValue)
                                .style('left', (d3.event.pageX) + 'px')
                                .style('top', (d3.event.pageY + 10) + 'px')
                                .style('opacity', 1.0);
                        })
                        .on("mouseout", function(d, i) {
                            d3.select(this)
                                .attr("fill", function(d, i) {
                                    return computeColor(linear(values[d.properties.name]));
                                });

                            tooltip.style('opacity', 0.0);
                        });

                    

                    // 定义一个线性渐变
                    if(opts.isShowLinearGradient){
                        var defs = d3.select(opts.container + ' .chinaMap_D3').append('defs');
                        var linearGradient = defs.append('linearGradient')
                            .attr('id', 'linearColor')
                            .attr('x1', '0%')
                            .attr('y1', '0%')
                            .attr('x2', '100%')
                            .attr('y2', '0%');
                        var stop1 = linearGradient.append('stop')
                            .attr('offset', '0%')
                            .style('stop-color', a);
                        var stop2 = linearGradient.append('stop')
                            .attr('offset', '100%')
                            .style('stop-color', b);
                        var colorRect = d3.select(opts.container + ' .chinaMap_D3').append('rect')
                            .attr('x', opts.gradient.x)
                            .attr('y', opts.gradient.y)
                            .attr('width', opts.gradient.width)
                            .attr('height', opts.gradient.height)
                            .style('fill', 'url(#' + linearGradient.attr('id') + ')');
                        var minValueText = d3.select(opts.container + ' .chinaMap_D3').append('text')
                            .attr('class', 'valueText')
                            .attr('x', opts.gradient.x)
                            .attr('y', opts.gradient.y)
                            .attr('dy', '-0.4em')
                            .style('fill', opts.gradient.textColor)
                            .style('font-size', opts.gradient.fontSize)
                            .style('text-anchor', opts.gradient.textAnchor)
                            .text(function() {
                                return minvalue;
                            });
                        var maxValueText = d3.select(opts.container + ' .chinaMap_D3').append('text')
                            .attr('class', 'valueText')
                            .attr('x', opts.gradient.x + opts.gradient.width)
                            .attr('y', opts.gradient.y)
                            .attr('dy', '-0.4em')
                            .style('fill', opts.gradient.textColor)
                            .style('font-size', opts.gradient.fontSize)
                            .style('text-anchor', opts.gradient.textAnchor)
                            .text(function() {
                                return maxvalue;
                            });
                    }


                    if(opts.isShowSouthSea){
                        d3.xml('southchinasea.svg', function(error, xmlDocument) {

                            d3.select(opts.container + ' .chinaMap_D3')
                                .append('defs')
                                .html(function(d) {
                                return d3.select(this).html() + xmlDocument.getElementsByTagName("g")[0].outerHTML;
                            });

                            var gSouthSea = d3.select("#southsea");

                            gSouthSea.attr("transform", "translate(" + opts.southSea.x + "," + opts.southSea.y + ")scale(0.5)")
                                .attr("class", "southsea")
                                .attr("stroke", opts.southSea.borderColor)
                                .attr("stroke-width", 1);

                            d3.select(opts.container + ' .chinaMap_D3')
                                .append('use')
                                .attr('xlink:href', '#southsea')
                        });
                    }

                });

            },
            matchProvinceName: function (nameZh){
                var that = this;
                var opts = that.conf;
                var temp = {
                    provinceMap: opts.provinceMapUrl,
                    scale: '',
                    center: ''
                };

                switch(nameZh)
                {
                    case '北京':
                        temp.provinceMap += 'beijing.geojson';
                        temp.scale = 7000;
                        temp.center = [116, 40];
                        break;
                    case '天津':
                        temp.provinceMap += 'tianjin.geojson';
                        temp.scale = 7000;
                        temp.center = [117, 39];
                        break;
                    case '河北':
                        temp.provinceMap += 'hebei.geojson';
                        temp.scale = 2500;
                        temp.center = [116, 39];
                        break;
                    case '山西':
                        temp.provinceMap += 'shanxi.geojson';
                        temp.scale = 2500;
                        temp.center = [112, 37];
                        break;
                    case '内蒙古':
                        temp.provinceMap += 'neimenggu.geojson';
                        temp.scale = 1000;
                        temp.center = [114, 46];
                        break;
                    case '辽宁':
                        temp.provinceMap += 'liaoning.geojson';
                        temp.scale = 3000;
                        temp.center = [122, 41];
                        break;
                    case '吉林':
                        temp.provinceMap += 'jilin.geojson';
                        temp.scale = 2500;
                        temp.center = [126, 44];
                        break;
                    case '黑龙江':
                        temp.provinceMap += 'heilongjiang.geojson';
                        temp.scale = 1500;
                        temp.center = [128, 49];
                        break;
                    case '上海':
                        temp.provinceMap += 'shanghai.geojson';
                        temp.scale = 14000;
                        temp.center = [121.3, 31.2];
                        break;
                    case '江苏':
                        temp.provinceMap += 'jiangsu.geojson';
                        temp.scale =4000;
                        temp.center = [119, 33];
                        break;
                    case '浙江':
                        temp.provinceMap += 'zhejiang.geojson';
                        temp.scale = 4000;
                        temp.center = [120, 29];
                        break;
                    case '安徽':
                        temp.provinceMap += 'anhui.geojson';
                        temp.scale = 4000;
                        temp.center = [117, 32];
                        break;
                    case '福建':
                        temp.provinceMap += 'fujian.geojson';
                        temp.scale = 4000;
                        temp.center = [118, 26];
                        break;
                    case '江西':
                        temp.provinceMap += 'jiangxi.geojson';
                        temp.scale = 3500;
                        temp.center = [115, 27.5];
                        break;
                    case '山东':
                        temp.provinceMap += 'shandong.geojson';
                        temp.scale = 4000;
                        temp.center = [118.5, 36.5];
                        break;
                    case '河南':
                        temp.provinceMap += 'henan.geojson';
                        temp.scale = 3500;
                        temp.center = [113.5, 34];
                        break;
                    case '湖北':
                        temp.provinceMap += 'hubei.geojson';
                        temp.scale = 4000;
                        temp.center = [112, 31];
                        break;
                    case '湖南':
                        temp.provinceMap += 'hunan.geojson';
                        temp.scale = 3500;
                        temp.center = [111, 27.5];
                        break;
                    case '广东':
                        temp.provinceMap += 'guangdong.geojson';
                        temp.scale = 3500;
                        temp.center = [113, 23];
                        break;
                    case '广西':
                        temp.provinceMap += 'guangxi.geojson';
                        temp.scale = 3500;
                        temp.center = [108, 23.5];
                        break;
                    case '海南':
                        temp.provinceMap += 'heinan.geojson';
                        temp.scale = 9000;
                        temp.center = [110, 19.2];
                        break;
                    case '重庆':
                        temp.provinceMap += 'chongqing.geojson';
                        temp.scale = 5000;
                        temp.center = [108, 30.2];
                        break;
                    case '四川':
                        temp.provinceMap += 'sichuan.geojson';
                        temp.scale = 2500;
                        temp.center = [103, 30.2];
                        break;
                    case '贵州':
                        temp.provinceMap += 'guizhou.geojson';
                        temp.scale = 4000;
                        temp.center = [106.5, 27];
                        break;
                    case '云南':
                        temp.provinceMap += 'yunnan.geojson';
                        temp.scale = 2500;
                        temp.center = [101, 25];
                        break;
                    case '西藏':
                        temp.provinceMap += 'xizang.geojson';
                        temp.scale = 1700;
                        temp.center = [88, 31];
                        break;
                    case '陕西':
                        temp.provinceMap += 'shaanxi.geojson';
                        temp.scale = 2500;
                        temp.center = [108, 35.6];
                        break;
                    case '甘肃':
                        temp.provinceMap += 'gansu.geojson';
                        temp.scale = 1800;
                        temp.center = [100, 37.7];
                        break;
                    case '青海':
                        temp.provinceMap += 'qinghai.geojson';
                        temp.scale = 2200;
                        temp.center = [96, 35.5];
                        break;
                    case '宁夏':
                        temp.provinceMap += 'ningxia.geojson';
                        temp.scale = 4500;
                        temp.center = [106, 37.3];
                        break;
                    case '新疆':
                        temp.provinceMap += 'xinjiang.geojson';
                        temp.scale = 1200;
                        temp.center = [85, 42];
                        break;
                    case '台湾':
                        temp.provinceMap += 'taiwan.geojson';
                        temp.scale = 6000;
                        temp.center = [120, 23.5];
                        break;
                    case '香港':
                        temp.provinceMap += 'hongkong.geojson';
                        temp.scale = 47000;
                        temp.center = [114.1, 22.35];
                        break;
                    case '澳门':
                        temp.provinceMap += 'macao.geojson';
                        temp.scale = 177000;
                        temp.center = [113.55, 22.16];
                        break;
                }

                return temp;
            }
        }
        window.ChinaMap = ChinaMap;
        return ChinaMap;
    }

    if (typeof define === 'function' && define.amd) {
        // support amd
        define(factory);
    } else if (typeof define === 'function' && define.cmd) {
        // support cmd
        define(function(require, exports, module) {
            return factory();
        });
    } else if (typeof exports !== 'undefined') {
        //suport node
        module.exports = factory();
    } else {
        this.ChinaMap = factory();
    }

})(window);