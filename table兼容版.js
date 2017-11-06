'use strict';

function Table(params) {
    // 容器ID【必填】
    this.container = $("#" + params.container_id);

    // ajax请求数据的地址【必填】
    this.url = params.url;

    // 每条数据的标识符【必填】
    this.pid = params.pid;

    // 标题行【必填】
    this.title_bar = params.title_bar;

    // 搜索条件【选填】    
    this.extra = params.extra;

    // 每页几条数据【选填，默认为10】
    this.each_page_data_number = params.each_page_data_number || 10;

    // 功能：自动序号【选填】
    params.auto_index = params.auto_index || {};
    this.auto_index = {
        _if: params.auto_index._if || false,
        _title: params.auto_index._title || '序号',
        _width: params.auto_index._width || 1
    };

    // 功能：单选、多选【选填】
    params.selection = params.selection || {};
    this.selection = {
        _type: params.selection._type || 'radio', //选填'radio' 'checkbox' 'neither' 
        _colomn_shown: params.selection._colomn_shown || false,
        _width: params.selection._width || 1
    };

    // 功能：排序
    // 需要添加排序功能的列【选填】
    this.sorted_colomn = params.sorted_colomn || [];
    // 在前台排序【默认为false】
    this.sort_in_front = params.sort_in_front || false;

    // 功能：更多信息【选填】    
    params.detail = params.detail || {};
    this.detail = {
        _key: params.detail._key,
        _formatter: params.detail._formatter,
        _width: params.detail._width || 2

        // 当前是第几页，初始化为1
    };this.current_page = 1;

    // 选中的数据的序号 [1,sum]
    this.selected = [];
    // 选中的数据的信息
    this.selected_info = [];

    // 数据（自动调用ajax获取）
    this.data = [];

    // 数据总数（自动调用ajax获取）
    this.sum = 0;

    this.init();
}
Table.prototype = {
    constructor: Table,
    init: function init() {
        this.container.css('position', 'relative');
        this.add_css();
        //将页数设为第一页
        this.current_page = 1;
        var post_params = { page: this.current_page, number: this.each_page_data_number };
        if (this.extra) {
            $.extend(post_params, this.extra);
        }
        var _this = this;
        $.ajax({
            url: _this.url,
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(post_params),
            success: function success(res) {
                // 获取新数据                
                _this.data = res.data;
                _this.sum = res.count;
                // 数据排序初始化
                _this.current_page_sort = [];
                for (var i = 0; i < this.data.length; i++) {
                    _this.current_page_sort.push(i);
                }
                // 更新页数范围
                _this.refresh_current_page_range();
                // 构建表格
                _this.establish_table_frame();
                setTimeout(function () {
                    _this.refresh_radio_and_checkbox();
                    _this.bind_events();
                }, 0);
            },
            error: function error() {
                alert('读取失败');
            }
        });
    },
    build: function build() {
        // 数据排序初始化
        this.current_page_sort = [];
        for (var i = 0; i < this.data.length; i++) {
            this.current_page_sort.push(i);
        }
        // 更新页数范围
        this.refresh_current_page_range();
        // 构建表格
        this.establish_tbody();
        var _this = this;
        setTimeout(function () {
            _this.refresh_radio_and_checkbox();
            _this.bind_events();
        }, 0);
    },
    add_css: function add_css() {
        var css = '\n        <!-- table\u7EC4\u4EF6\u7684css -->\n        <style id="table-css">\n        table.x-table {\n            border-collapse: collapse;\n            width: 100%;\n            background:white;\n        }\n        /*\u81EA\u52A8\u5E8F\u53F7\u3001\u5355\u9009\u3001\u591A\u9009\uFF1A\u6587\u5B57\u5C45\u4E2D*/\n        table.x-table .x-index,table.x-table .x-radio,table.x-table .x-checkbox{\n            text-align: center;\n        }\n        /*th*/\n        table.x-table th{\n            background: #009de1;\n            color: #fff;\n            text-align: center;\n            height: 30px;            \n            font-size: 13px;\n            padding: 0;\n        }\n        /*td*/\n        table.x-table td{\n            color: #646464;\n            text-align: center;\n            border-bottom: 1px dashed #cfcfcf;\n            height: 35px;\n            font-size: 14px;\n            padding: 0;\n            cursor:pointer;\n        }\n        /*\u591A\u9009\u65F6\uFF0C\u8868\u5934\u7684\u5168\u9009\u6309\u94AE*/\n        table.x-table thead input[name="x-input-checkbox-all"]{\n            margin-top:5px;\n        }\n        /*\u589E\u5220\u6539\u6309\u94AE*/\n        table.x-table td a,table.x-table td input{\n            display: inline-block;\n            background: #ff9600;\n            color: #fff;\n            padding: 3px 10px;\n            margin: 0 5px;\n            border-radius: 3px;\n        }\n        /*\u6DFB\u52A0\u4E86\u6392\u5E8F\u529F\u80FD\u7684\u5217\u7684th*/\n        table.x-table th.sorted{\n            cursor: pointer;\n            position:relative;\n        }\n        table.x-table th.sorted>i{\n            position: relative;\n            display: inline-block;\n            width: 16px;\n            height: 18px;\n            top: 7px;\n            left: 5px;\n            background:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAkklEQVQoU7WS2Q0CMQxEnzuASoAK2BIoiY4QFcB2AJVAB4PGOFI4JPJDfmzHfo6PBHUkLYCTzYjYWEq6WDQ7feVowesC2r16O/UucwaPAGdgC1yB1QiwByZgB9x+Aq2M6uWlZkmfPfwFAJbAAZhzfN0uvpYEeB+e4nEUcE5PcRoFnsER93fAT/tr5BLra1jNYCsPDaRqRFZ8Da0AAAAASUVORK5CYII=") no-repeat 0 0;\n        }\n        /*  "\u8BE6\u60C5+" \u5217*/\n        table.x-table td.x-detail{\n            font-weight:bold;\n            font-size:20px;\n            color:#097abf;\n        }\n        table.x-table td.x-detail:hover{\n            color:#60c3ff;\n        }\n        /*  "\u8BE6\u60C5+" div*/\n        .x-detail-faketables{\n            position:absolute;\n            z-index:1;\n            left:0;\n            top:0;\n            bottom:35px;\n            display:none;\n            width:100%;\n        }\n        .x-detail-faketables table.x-faketable1{\n\n        }\n        /* \u663E\u793A\u8BE6\u60C5\u7684\u4E00\u884C\u4E0D\u8981cursor */\n        table.x-faketable1 tr.x-tr-detail td{\n            cursor:default;\n        }\n        .x-detail-faketables table.x-faketable2{\n            position:relative;\n            top:-30px;\n            z-index:-1;\n        }\n        /*\u81EA\u52A8\u6362\u884C*/\n        table.x-table th,table.x-table td{\n            word-break:break-all;\n            word-wrap:break-word;\n        }\n        /*\u9009\u4E2D\u6548\u679C*/\n        table.x-table .selected td {\n            background-color: #ffeee2;\n        }\n        /*\u5E95\u90E8\u5206\u9875*/\n        .x-table-page{\n            line-height: 50px;\n            color: #646464;\n            font-size: 13px;\n            position: relative;\n            padding-left:20px;       \n        }\n        .x-table-page .x-table-page-right{\n            position: absolute;\n            right: 0;\n            top: 0;\n        }\n        .x-table-page a{\n            padding: 2px 7px;\n            border: 1px solid #ccc;\n            margin: 0 5px;\n            color: #555;\n            text-decoration: none;\n            vertical-align: top;\n        }\n        .x-table-page input[type="text"]{\n            width: 23px;\n            height: 19px;\n            border: 1px solid #ccc;\n        }\n        </style>';
        if ($('style#table-css').length === 0) {
            $('body').append(css);
        }
    },
    // 构建整体：表头thead+表格内容tbody+分页page+假表格（初始化时调用）
    establish_table_frame: function establish_table_frame() {
        var _this = this;
        var table_html = '\n        <table class="x-table">\n            <thead>\n                <tr>';
        if (_this.detail._formatter) {
            table_html += '<th width=' + _this.detail._width + '% class="x-detail"></th>';
        }
        table_html += '\n                    ' + (_this.auto_index._if ? '<th width=' + _this.auto_index._width + '% class="x-index">' + _this.auto_index._title + '</th>' : '') + '\n                    ' + (_this.selection._type === 'radio' && _this.selection._colomn_shown === true ? '<th width=' + _this.selection._width + '% class="x-radio"></th>' : '') + '\n                    ' + (_this.selection._type === 'checkbox' && _this.selection._colomn_shown === true ? '<th width=' + _this.selection._width + '% class="x-checkbox"><input type="checkbox" name="x-input-checkbox-all"></th>' : '');
        $.each(_this.title_bar, function (index, each_title) {
            if (typeof each_title.show === "undefined" || each_title.show) {
                table_html += '\n                <th width="' + each_title.width + '%" keyName="' + each_title.key + '">' + each_title.name + '<i></i></th>';
            }
        });
        table_html += '</tr>\n            </thead>\n            <tbody>';
        // 如果无数据
        if (_this.data.length === 0) {
            table_html += '<tr><td colspan="999" style="font-weight:bold;">\u6682\u65E0\u6570\u636E!</td></tr>';
        } else {
            $.each(_this.data, function (index, each_data) {
                table_html += '\n                    <tr ';
                $.each(_this.pid, function (index, pid) {
                    table_html += ' ' + pid + '=' + each_data[pid];
                });
                table_html += '>';
                if (_this.detail._formatter) {
                    var detail_td_data;
                    if (typeof _this.detail._key === 'string') {
                        detail_td_data = each_data[_this.detail._key];
                    } else {
                        detail_td_data = [];
                        $.each(_this.detail._key, function (index, val) {
                            detail_td_data.push(each_data[_this.detail._key[index]]);
                        });
                        detail_td_data = JSON.stringify(detail_td_data);
                    }
                    table_html += '<td class=\'x-detail\' data=\'' + detail_td_data + '\' operation>+</td>';
                }
                table_html += '\n                        ' + (_this.auto_index._if ? '<td class="x-index">' + (index + 1) + '</td>' : '') + '\n                        ' + (_this.selection._type === 'radio' && _this.selection._colomn_shown === true ? '\n                        <td class="x-radio">\n                            <input type="radio" name="x-input-radio">\n                        </td>' : '') + '\n                        ' + (_this.selection._type === 'checkbox' && _this.selection._colomn_shown === true ? '\n                        <td class="x-checkbox">\n                            <input type="checkbox" name="x-input-checkbox">\n                        </td>' : '');
                $.each(_this.title_bar, function (index, each_title) {
                    if (typeof each_title.show === "undefined" || each_title.show) {
                        var td_data = each_data[each_title.key];
                        if (each_title.formatter) {
                            // 有formatter
                            td_data = each_title.formatter(td_data);
                        }
                        if (each_title.operation) {
                            // 是"操作类"单元格
                            table_html += '<td operation ' + (each_title.css ? ' style=' + each_title.css : '') + '>' + td_data + '</td>';
                        } else {
                            // 普通单元格
                            table_html += '<td' + (each_title.css ? ' style=' + each_title.css : '') + ' title="' + td_data + '">' + td_data + '</td>';
                        }
                    }
                });
                table_html += '\n                </tr>\n                ';
            });
        }

        table_html += '</tbody>\n        </table>\n        <div class="x-table-page">\n            <select>\n                <option value="5">5</option>\n                <option value="10">10</option>\n                <option value="20">20</option>\n                <option value="30">30</option>\n                <option value="50">50</option>\n            </select>\n            \u5171' + _this.sum + '\u6761\u6570\u636E\uFF08\u5F53\u524D\u7B2C' + _this.current_page + '/' + (Math.ceil(_this.sum / _this.each_page_data_number) || 1) + '\u9875\uFF09';
        if (_this.selection._type === 'checkbox') {
            table_html += '\n                <a class="x-table-page-clear-all">\u5168\u90E8\u53D6\u6D88</a>';
        }
        table_html += '\n            <div class="x-table-page-right">\n                <a class="x-table-page-right-prev">&lt;</a>\n                <a class="x-table-page-right-next">&gt;</a>\n                \u7B2C\n                <input type="text" class="x-table-page-right-page">\u9875\n                <a class="x-table-page-right-jump">\u8F6C\u5230</a>\n            </div>\n        </div>';
        // 详情+ div
        if (_this.detail._formatter) {
            table_html += '\n            <div class="x-detail-faketables">\n                <table class="x-table x-faketable1"></table>             \n                <table class="x-table x-faketable2"></table>             \n            </div>';
        }
        _this.container.html(table_html);
        // 将'每页几条数据'更新到页脚
        _this.container.find('.x-table-page select option[value=' + _this.each_page_data_number + ']').prop('selected', 'true');
    },
    // 只构建表格内容tbody（刷新表格时调用）
    establish_tbody: function establish_tbody() {
        var _this = this;
        var tbody_html = '<tbody>';
        // 如果无数据
        if (_this.data.length === 0) {
            tbody_html += '<tr><td colspan="999" style="font-weight:bold;">\u6682\u65E0\u6570\u636E!</td></tr>';
        } else {
            $.each(_this.data, function (index, each_data) {
                tbody_html += '\n                    <tr ';
                $.each(_this.pid, function (index, pid) {
                    tbody_html += ' ' + pid + '=' + each_data[pid];
                });
                tbody_html += '>';
                if (_this.detail._formatter) {
                    var detail_td_data;
                    if (typeof _this.detail._key === 'string') {
                        detail_td_data = each_data[_this.detail._key];
                    } else {
                        detail_td_data = [];
                        $.each(_this.detail._key, function (index, val) {
                            detail_td_data.push(each_data[_this.detail._key[index]]);
                        });
                        detail_td_data = JSON.stringify(detail_td_data);
                    }
                    tbody_html += '<td class=\'x-detail\' data=\'' + detail_td_data + '\' operation>+</td>';
                }
                tbody_html += '\n                        ' + (_this.auto_index._if ? '<td class="x-index">' + (index + 1) + '</td>' : '') + '\n                        ' + (_this.selection._type === 'radio' && _this.selection._colomn_shown === true ? '\n                        <td class="x-radio">\n                            <input type="radio" name="x-input-radio">\n                        </td>' : '') + '\n                        ' + (_this.selection._type === 'checkbox' && _this.selection._colomn_shown === true ? '\n                        <td class="x-checkbox">\n                            <input type="checkbox" name="x-input-checkbox">\n                        </td>' : '');
                $.each(_this.title_bar, function (index, each_title) {
                    if (typeof each_title.show === "undefined" || each_title.show) {
                        var td_data = each_data[each_title.key];
                        if (each_title.formatter) {
                            // 有formatter
                            td_data = each_title.formatter(td_data);
                        }
                        if (each_title.operation) {
                            // 是"操作类"单元格
                            tbody_html += '<td operation ' + (each_title.css ? ' style=' + each_title.css : '') + '>' + td_data + '</td>';
                        } else {
                            // 普通单元格
                            tbody_html += '<td' + (each_title.css ? ' style=' + each_title.css : '') + ' title="' + td_data + '">' + td_data + '</td>';
                        }
                    }
                });
                tbody_html += '\n                </tr>\n                ';
            });
        }
        tbody_html += '</tbody>';
    },
    bind_events: function bind_events() {
        var _this = this;
        _this.container.find('.x-table-page').css('paddingTop', '0px');
        // 单选+多选
        switch (_this.selection._type) {
            case 'radio':
                _this.container.find(">table td:not('[operation]')").click(function () {
                    var _td = this;
                    var info = {
                        index: _this.current_page_sort[$(_td).parents('tr').index()] + _this.current_page_min
                    };
                    $.each(_this.pid, function (index, pid) {
                        info[pid] = $(_td).parents('tr').attr(pid);
                    });
                    _this.selected_info = [info];
                    _this.selected = [info.index];
                    _this.refresh_radio_and_checkbox();
                });
                break;
            case 'checkbox':
                // 点击主表格中任一单元格，都能选中当前数据行（多选）
                _this.container.find(">table td:not('[operation]')").click(function () {
                    var _td = this;
                    var info = {
                        index: _this.current_page_sort[$(_td).parents('tr').index()] + _this.current_page_min
                    };
                    $.each(_this.pid, function (index, pid) {
                        info[pid] = $(_td).parents('tr').attr(pid);
                    });
                    if ($.inArray(info.index, _this.selected) !== -1) {
                        //之前有，点一下取消选择
                        var position = $.inArray(info.index, _this.selected);
                        _this.selected.splice(position, 1);
                        _this.selected_info.splice(position, 1);
                    } else {
                        // 没有，点一下后选上
                        _this.selected.push(info.index);
                        _this.selected_info.push(info);
                    }
                    _this.refresh_radio_and_checkbox();
                });
                // 多选列显示时，当前页全选的功能
                if (_this.selection._colomn_shown) {
                    var btn = this.container.find('>table input[name="x-input-checkbox-all"]');
                    var btns = this.container.find('>table input[name="x-input-checkbox"]');
                    btn.click(function () {
                        var state = btn.prop('checked');
                        btns.each(function (index, el) {
                            if ($(el).prop('checked') !== state) {
                                $(el).trigger('click');
                            }
                        });
                    });
                }
                break;
            default:
                break;
        }
        // 排序
        var extraColomn = 0;
        if (_this.auto_index._if) {
            extraColomn++;
        }
        if (_this.selection._type === 'radio' && _this.selection._colomn_shown) {
            extraColomn++;
        } else if (_this.selection._type === 'checkbox' && _this.selection._colomn_shown) {
            extraColomn++;
        }
        if (_this.detail._formatter) {
            extraColomn++;
        }
        $.each(_this.sorted_colomn, function (index, val) {
            _this.container.find('>table th').eq(val + extraColomn - 1).attr('sort_method', 'original');
            _this.container.find('>table th').eq(val + extraColomn - 1).addClass('sorted');
            _this.container.find('>table th').eq(val + extraColomn - 1).click(function () {
                if (_this.sort_in_front === true) {
                    // 在前台排序，只排当前页的数据
                    var old_current_page_sort = _this.current_page_sort;
                    _this.current_page_sort = [];
                    var _index = $(this).index() - extraColomn;
                    var arr = [];
                    $.each(_this.data, function (index, each_data) {
                        var key = _this.title_bar[_index].key;
                        var cell = each_data[key];
                        arr.push(cell);
                    });
                    var original_arr = arr.concat([]);
                    if ($(this).attr('sort_method') === 'original') {
                        // 如果现在是"初始顺序"，则点一下后变成"从小到大"
                        arr.sort(function (a, b) {
                            if (/\d+/.test(a) && /\d+/.test(b)) {
                                return parseInt(a) - parseInt(b);
                            } else {
                                return a > b;
                            }
                        });
                        $.each(arr, function (index, val) {
                            var target = val;
                            $.each(original_arr, function (index, val) {
                                if (target === val && $.inArray(index, _this.current_page_sort) === -1) {
                                    _this.current_page_sort.push(index);
                                    return false;
                                }
                            });
                        });
                        $(this).attr('sort_method', 'asc');
                    } else if ($(this).attr('sort_method') === 'asc') {
                        // 如果现在是"从小到大"，则点一下后变成"从大到小"
                        arr.sort(function (a, b) {
                            if (/\d+/.test(a) && /\d+/.test(b)) {
                                return parseInt(b) - parseInt(a);
                            } else {
                                return b > a;
                            }
                        });
                        $.each(arr, function (index, val) {
                            var target = val;
                            $.each(original_arr, function (index, val) {
                                if (target === val && $.inArray(index, _this.current_page_sort) === -1) {
                                    _this.current_page_sort.push(index);
                                    return false;
                                }
                            });
                        });
                        $(this).attr('sort_method', 'desc');
                    } else {
                        // 如果现在是"从大到小"，则点一下后变成"初始顺序"
                        $.each(arr, function (index, val) {
                            _this.current_page_sort.push(index);
                        });
                        $(this).attr('sort_method', 'original');
                    }
                    // 将数据行重排
                    var row = [];
                    for (var i = 0; i < _this.data.length; i++) {
                        var position = $.inArray(_this.current_page_sort[i], old_current_page_sort);
                        row.push(_this.container.find('>table tbody tr').eq(position));
                    }
                    _this.container.find('>table tbody').html();
                    $.each(row, function (index, val) {
                        _this.container.find('>table tbody').append(val);
                    });
                    // 序号重新排序
                    _this.container.find('>table td.x-index').each(function (index, el) {
                        $(el).html(index + 1);
                    });
                } else {
                    // 后台排序（整个数据库排）
                    var keyName = $(this).attr('keyName');
                    switch ($(this).attr('sort_method')) {
                        case 'original':
                            _this.sort_refresh(keyName, 'asc');
                            $(this).attr('sort_method', 'asc');
                            break;
                        case 'asc':
                            _this.sort_refresh(keyName, 'desc');
                            $(this).attr('sort_method', 'desc');
                            break;
                        case 'desc':
                            _this.sort_refresh(keyName, 'original');
                            $(this).attr('sort_method', 'original');
                            break;
                    }
                }
            });
        });
        // 详情+
        _this.container.find('>table tbody td.x-detail').click(function () {
            _this.establish_faketable_frame(this);
        });
    },
    bind_tbody_events: function bind_tbody_events() {
        var _this = this;
        // 分页："每页条数"发生变化时
        _this.container.find('.x-table-page select').change(function () {
            _this.each_page_data_number = parseInt($(this).val());
            //将页数设为第一页
            _this.current_page = 1;
            _this.page_change();
        });
        // 分页：上一页
        _this.container.find('.x-table-page-right-prev').click(function () {
            if (_this.current_page === 1) {
                alert('当前页是第一页');
            } else {
                _this.current_page--;
                _this.page_change();
            }
        });
        // 分页：下一页
        _this.container.find('.x-table-page-right-next').click(function () {
            var total_page = Math.ceil(_this.sum / _this.each_page_data_number);
            if (total_page === 0) {
                total_page = 1;
            }
            if (_this.current_page === total_page) {
                alert('当前页是最后一页');
            } else {
                _this.current_page++;
                _this.page_change();
            }
        });
        // 分页：跳转
        _this.container.find('.x-table-page-right-jump').click(function () {
            var page = parseInt(_this.container.find('.x-table-page-right-page').val());
            var total_page = Math.ceil(_this.sum / _this.each_page_data_number);
            if (total_page === 0) {
                total_page = 1;
            }
            if (page >= 1 && page <= total_page) {
                if (page !== _this.current_page) {
                    _this.current_page = page;
                    _this.page_change();
                }
            } else {
                alert('\u65E0\u6548\u8F93\u5165\uFF0C\u9875\u7801\u8303\u56F4\uFF1A[1,' + total_page + ']');
            }
        });
        // 分页：全消
        _this.container.find('.x-table-page-clear-all').click(function () {
            _this.clear_all();
        });
    },
    // 构建faketable
    establish_faketable_frame: function establish_faketable_frame(obj) {
        var _this = this;
        var num = $(obj).parents('tr').index();
        _this.container.find('.x-detail-faketables').css('display', 'block');
        // 填充上面的表格
        var table_upperhtml = '';
        table_upperhtml += _this.container.find('>table thead').prop('outerHTML');
        table_upperhtml += '<tbody>';
        $.each(_this.container.find('>table tbody tr'), function (index, tr) {
            if (index <= num) {
                table_upperhtml += $(tr).prop('outerHTML');
            }
        });
        // 填充info
        var data = $(obj).attr("data");
        var str_info;
        // 注意：data转成数组，用apply传进去
        data = JSON.parse(data);
        str_info = _this.detail._formatter.apply(this, data);
        table_upperhtml += '\n                    <tr class="x-tr-detail">\n                        <td></td>\n                        <td colspan="999">' + str_info + '</td>\n                    </tr>';
        table_upperhtml += '</tbody>';

        /*IE低版本中,jQuery添加行间属性，来添加事件。
        所以复制的HTML中的元素，该行间属性相同，添加、删除事件时，原、现会干扰。
        所以在复制之后，把这个行间属性去掉*/
        var reg = /(jQuery\d{21}=")\d{1,}"/gi;
        table_upperhtml = table_upperhtml.replace(reg, function (match, p1) {
            return p1 + '"';
        });

        _this.container.find('.x-faketable1').html(table_upperhtml);
        //填充下面的表格
        var table_lowerhtml = '';
        table_lowerhtml += _this.container.find('>table thead').prop('outerHTML');
        table_lowerhtml += '<tbody>';
        $.each(_this.container.find('>table tbody tr'), function (index, tr) {
            if (index > num) {
                table_lowerhtml += $(tr).prop('outerHTML');
            }
        });
        table_lowerhtml += '</tbody>';

        /*IE低版本中,jQuery添加行间属性，来添加事件。
        所以复制的HTML中的元素，该行间属性相同，添加、删除事件时，原、现会干扰。
        所以在复制之后，把这个行间属性去掉*/
        table_lowerhtml = table_lowerhtml.replace(reg, function (match, p1) {
            return p1 + '"';
        });

        _this.container.find('.x-faketable2').html(table_lowerhtml);

        // IE10-不支持setTimeout传递第3+个参数 所以放到全局属性里
        _this.f_ie_num = num;
        _this.f_ie_obj = obj;

        var timeInterval = 0;
        // IE渣渣，时间需要调长
        if (navigator.userAgent.indexOf('MSIE') >= 0 && navigator.userAgent.indexOf('Opera') < 0) {
            // timeInterval=1000;
        }
        setTimeout(function () {
            // "+"改成"-"
            _this.container.find('.x-faketable1 td.x-detail:last').html("-");
            var h = _this.container.find('.x-faketable1 tr:last').height();
            _this.container.find('.x-table-page').animate({
                'paddingTop': h + 'px'
            }, 500);
            // _this.container.find('.x-table-page').css('paddingTop', h + 'px');
            _this.bind_fake_events();
        }, timeInterval);
    },
    // 给faketable绑定点击事件（把click传给真的table）
    bind_fake_events: function bind_fake_events() {
        var _this = this;
        var num;
        // 单选多选
        _this.container.find(".x-faketable1 td:not([operation],:last)").off();
        _this.container.find(".x-faketable1 td:not([operation],:last)").click(function () {
            num = $(this).parents('tr').index();
            _this.container.find('>table tbody tr').eq(num).find("td:not('[operation]')").eq(0).trigger('click');
            _this.establish_faketable_frame(_this.f_ie_obj);
        });
        _this.container.find(".x-faketable2 td:not([operation])").off();
        _this.container.find(".x-faketable2 td:not([operation])").click(function () {
            num = $(this).parents('tr').index() + _this.f_ie_num + 1;
            _this.container.find('>table tbody tr').eq(num).find("td:not('[operation]')").eq(0).trigger('click');
            _this.establish_faketable_frame(_this.f_ie_obj);
        });
        // 排序

        _this.container.find('.x-faketable1 th.sorted').off('click');
        _this.container.find('.x-faketable1 th.sorted').click(function () {
            num = $(this).index();
            _this.container.find('>table th.sorted').eq(num).trigger('click');
            _this.container.find('.x-detail-faketables').html();
            _this.container.find('.x-detail-faketables').css('display', 'none');
            _this.container.find('.x-table-page').css('paddingTop', '0px');
        });

        // 点击+
        _this.container.find(".x-faketable1 td.x-detail").off('click');
        _this.container.find(".x-faketable1 td.x-detail").click(function () {
            num = $(this).parents('tr').index();
            if (num === _this.f_ie_num) {
                _this.container.find('.x-detail-faketables').html();
                _this.container.find('.x-detail-faketables').css('display', 'none');
                _this.container.find('.x-table-page').css('paddingTop', '0px');
            } else {
                _this.container.find('>table td.x-detail').eq(num).trigger('click');
                // 原table中对应的+td
                var _addtd = _this.container.find(">table td.x-detail").eq(num);
                _this.establish_faketable_frame(_addtd);
            }
        });
        _this.container.find(".x-faketable2 td.x-detail").off('click');
        _this.container.find(".x-faketable2 td.x-detail").click(function () {
            if (num === _this.f_ie_num) {
                _this.container.find('.x-detail-faketables').html();
                _this.container.find('.x-detail-faketables').css('display', 'none');
            } else {
                num = $(this).parents('tr').index() + _this.f_ie_num + 1;
                _this.container.find('>table td.x-detail').eq(num).trigger('click');
                // 原table中对应的+td
                var _addtd = _this.container.find(">table td.x-detail").eq(num);
                _this.establish_faketable_frame(_addtd);
            }
        });
    },
    refresh_radio_and_checkbox: function refresh_radio_and_checkbox() {
        this.container.find('tbody tr').removeClass('selected');
        // 单选模式
        if (this.selection._type === 'radio') {
            this.container.find('input[name="x-input-radio"]').prop('checked', false);
            // 如果单选的内容在当前页
            if (this.selected[0] >= this.current_page_min && this.selected[0] <= this.current_page_max) {
                var position = this.selected[0] - this.current_page_min;
                position = $.inArray(position, this.current_page_sort);
                this.container.find('input[name="x-input-radio"]').eq(position).prop('checked', true);
                this.container.find('tbody tr').eq(position).addClass('selected');
            }
        }
        // 多选模式
        if (this.selection._type === 'checkbox') {
            // 刷新多选
            this.container.find('input[name="x-input-checkbox"]').prop('checked', false);
            var _this = this;
            $.each(this.selected, function (index, val) {
                // 如果多选的内容在当前页
                if (val >= _this.current_page_min && val <= _this.current_page_max) {
                    // 左边表格 多选按钮的状态刷新                
                    var position = val - _this.current_page_min;
                    position = $.inArray(position, _this.current_page_sort);
                    _this.container.find('input[name="x-input-checkbox"]').eq(position).prop('checked', true);
                    _this.container.find('tbody tr').eq(position).addClass('selected');
                }
            });
            // 全选按钮
            if (this.selection._colomn_shown) {
                this.container.find('input[name="x-input-checkbox-all"]').prop('checked', true);
                this.container.find('input[name="x-input-checkbox"]').each(function (index, el) {
                    if ($(el).prop('checked') === false) {
                        _this.container.find('input[name="x-input-checkbox-all"]').prop('checked', false);
                    }
                });
            }
        }
    },
    refresh_current_page_range: function refresh_current_page_range() {
        // 当前页中的第一条数据，是总起第几条
        this.current_page_min = (this.current_page - 1) * this.each_page_data_number + 1;
        // 当前页中的最后一条数据，是总起第几条
        this.current_page_max = this.current_page_min + this.data.length - 1;
    },
    clear_all: function clear_all() {
        if (confirm('确定清除所有已选项?')) {
            this.selected = [];
            this.selected_info = [];
            this.refresh_radio_and_checkbox();
        }
    },
    // 手动刷新时，调用该函数
    refresh: function refresh(extra) {
        var _this = this;
        //将页数设为第一页
        _this.current_page = 1;
        if (extra) {
            _this.extra = extra;
        }
        var post_params = { page: _this.current_page, number: _this.each_page_data_number };
        if (_this.extra) {
            $.extend(post_params, _this.extra);
        }
        $.ajax({
            url: _this.url,
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(post_params),
            success: function success(res) {
                // 获取新数据                
                _this.data = res.data;
                _this.sum = res.count;
                //清除以前的选中记录
                _this.selected = [];
                _this.selected_info = [];
                // 重建表格
                _this.build();
            },
            error: function error() {
                alert('读取失败');
            }
        });
    },
    // 分页操作时，自动调用该函数，来刷新表格
    page_change: function page_change() {
        var _this = this;
        var post_params = { page: _this.current_page, number: _this.each_page_data_number };
        if (_this.extra) {
            $.extend(post_params, _this.extra);
        }
        $.ajax({
            url: _this.url,
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(post_params),
            success: function success(res) {
                // 获取新数据
                _this.data = res.data;
                _this.sum = res.count;
                // 重建表格
                _this.build();
            },
            error: function error() {
                alert('读取失败');
            }
        });
    },
    // 后台排序时，点击表头，调用该函数来刷新
    sort_refresh: function sort_refresh(sort_name, sort_method) {
        var _this = this;
        var post_params = {
            page: _this.current_page,
            number: _this.each_page_data_number,
            sort_name: sort_name,
            sort_method: sort_method
        };
        console.log(post_params);
        if (_this.extra) {
            $.extend(post_params, _this.extra);
        }
        $.ajax({
            url: _this.url,
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(post_params),
            success: function success(res) {
                // 获取新数据
                _this.data = res.data;
                _this.sum = res.count;
                // 重建表格
                _this.build();
            },
            error: function error() {
                alert('读取失败');
            }
        });
    },
    get_selected: function get_selected(name) {
        var arr = [];
        $.each(this.selected_info, function (index, info) {
            arr.push(info[name]);
        });
        return arr;
    }
};