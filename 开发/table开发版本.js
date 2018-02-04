function Table(params) {
    // 容器ID【必填】
    this.container = $("#" + params.id);

    // ajax请求数据的地址【必填】
    this.url = params.url;

    // 标题行【必填】
    this.title = params.title;

    // 搜索条件【选填】    
    this.searchTerms = params.searchTerms || {};

    // 每页显示的条数，值务必对应dataLimits参数的选项。
    this.dataLimit = params.dataLimit || 10;
    // 每页条数的选择项
    this.dataLimits = params.dataLimits || [5, 10, 20, 50];


    // 功能：自动序号【选填】
    params.auto_index = params.auto_index || {};
    this.auto_index = {
        show: params.auto_index.show || false,
        title: params.auto_index.title || '序号',
        width: params.auto_index.width || 2
    };


    // 功能：单选、多选【选填】
    params.selection = params.selection || {};
    this.selection = {
        type: params.selection.type || 'radio',
        pid: params.selection.pid,
        colomn_shown: params.selection.colomn_shown || false,
        width: params.selection.width || 2,
    };


    // 功能：排序    
    // 排序方法：'back'后台所有数据排序;'front'前台当前页数据排序
    this.sort = params.sort || 'front';

    // 功能：更多信息【选填】    
    params.detail = params.detail || {};
    this.detail = {
        key: params.detail.key,
        width: params.detail.width || 2,
        formatter: params.detail.formatter
    };

    this.init();
}
Table.prototype = {

        /*
         *      
         *  --------- 0 "对外"的函数 ---------  

         *   【使用本组件时，可能会调用的函数。】
         *   refresh：刷新表格
         *   get_selected：获取所有已选项 
         *  
         *  ------------------------------ 
         *      
         */
        // 刷新表格（"对外"）
        refresh: function(searchTerms) {
            if (searchTerms) {
                // 有新的搜索条件
                this.searchTerms = searchTerms;
            }
            this.refresh_all_kinds(this.refresh_type.OUTER_REFRESH);
        },
        // 获取所有已选项("对外")
        get_selected: function(name) {
            var arr = [];
            $.each(this.selected_info, function(index, info) {
                arr.push(info[name]);
            });
            return arr;
        },

        /*
         *      
         *  --------- 1 核心函数 --------- 
         *      
         *   init()：初始化函数
         *   build_html()：搭建html（包括table+分页）
         *   bind_events()：绑定所有事件
         *   refresh_all_kinds()：调用ajax刷新，具体刷新方式根据所传参数决定
         *   refresh_frontSort_effectes()：
         *      刷新表格后，需要维持和之前一样的排序效果。
         *      如果是前台排序：需要在ajax得到data后对data重新排序，再搭建html
         *      后台排序：只需要在ajax请求时，加上排序相关参数
         *   
         *  ---------------------------------- 
         *      
         */
        // 初始化函数
        init: function() {
            // 添加css
            if ($('style#table-css').length === 0) {
                this.add_style();
            }

            // 初始化"排序方式"
            this.reset_sort_methods();

            // 刷新表格
            this.refresh_all_kinds(this.refresh_type.INIT);
        },
        // 搭建html（包括table+分页）
        build_html: function() {
                var _this = this;
                var table_html = `
        <table class="x-table">
            <thead>
                <tr>
            ${_this.detail.formatter?`<th width="${_this.detail.width}%" class="x-detail-btn"></th>`:""}
            ${_this.auto_index.show?`<th width="${_this.auto_index.width}%" class="x-index">${_this.auto_index.title}</th>`:""}
            ${_this.selection.type=='radio'&&_this.selection.colomn_shown?`<th width="${_this.selection.width}%" class="x-radio"></th>`:""}
            ${_this.selection.type=='checkbox'&&_this.selection.colomn_shown?`<th width="${_this.selection.width}%" class="x-checkbox"><input type="checkbox" name="x-input-checkbox-all"></th>`:""}`;
        $.each(_this.title, function(index, each_title) {
            table_html += `
            <th width="${each_title.width}%" ${each_title.key?`keyName="${each_title.key}"`:''} ${each_title.sort?"sort":""}>${each_title.name}<i></i></th>`;
        });
        table_html += `
                </tr>
            </thead>
            <tbody>`;
        if (_this.data.length === 0) {
            // 无数据
            table_html += `<tr><td colspan="999" style="font-weight:bold;">暂无数据!</td></tr>`;
        } else {
            $.each(_this.data, function(index, each_data) {
                table_html += `
                    <tr `;

                if(_this.selection.pid){
                    $.each(_this.selection.pid, function(index, pid) {
                        table_html += `x-${pid}="${each_data[pid]}"`;
                    });
                }
                table_html += `>`;
                table_html += `
                        ${_this.detail.formatter?`<td class="x-detail-btn" show=0 crud>+</td>`:``}
                        ${_this.auto_index.show?`<td class="x-index">${index+1}</td>`:``}
                        ${_this.selection.type==='radio'&&_this.selection.colomn_shown===true?`
                        <td class="x-radio">
                            <input type="radio" name="x-input-radio">
                        </td>`:``}
                        ${_this.selection.type==='checkbox'&&_this.selection.colomn_shown===true?`
                        <td class="x-checkbox">
                            <input type="checkbox" name="x-input-checkbox">
                        </td>`:``}`;
                $.each(_this.title, function(_index, each_title) {
                    if (each_title.crud) {
                        // 是"操作类"单元格：detail列 和增删改查列
                        // 添加crud属性，不添加title属性
                        // 不需要key，需要formatter，formatter的参数为index，取到每行数据
                        table_html += '<td crud>' + each_title.formatter(index) + '</td>';
                    } else {
                        // 普通单元格(不添加crud属性，添加title属性)
                        var td_data = each_data[each_title.key];
                        if (each_title.formatter) {
                            // 如果有formatter，用formatter处理
                            td_data = each_title.formatter(td_data);
                        }
                        table_html += '<td title="' + td_data + '">' + td_data + '</td>';
                    }
                });
                table_html += `</tr>`;
            });
        }

        table_html += `</tbody>
        </table>
        <div class="x-table-page">
            <select>`
        $.each(_this.dataLimits, function(index, val) {
            table_html += `<option value="${val}">${val}</option>`;
        });
        table_html += `</select>
            共${_this.count}条数据（当前第${_this.current_page}/${Math.ceil(_this.count/_this.dataLimit)||1}页）`;
        if (_this.selection.type === 'checkbox') {
            table_html += `
                <a class="x-table-page-clear-all">全部取消</a>`;
        }
        table_html += `
            <div class="x-table-page-right">
                <a class="x-table-page-right-prev">&lt;</a>
                <a class="x-table-page-right-next">&gt;</a>
                第
                <input type="text" class="x-table-page-right-page">页
                <a class="x-table-page-right-jump">转到</a>
            </div>
        </div>`;
        _this.container.html(table_html);
        // 将'每页几条数据'更新到页脚
        _this.container.find(`.x-table-page select option[value=${_this.dataLimit}]`).prop('selected', 'true');
    },
    // 绑定所有事件
    bind_events: function() {
        // 绑定单选、多选
        this.bind_event_select();
        // 绑定"详情+"
        this.bind_event_detail();
        // 绑定排序
        this.bind_event_sort();
        // 绑定分页相关事件
        this.bind_event_page();
    },
    // 调用ajax刷新，具体刷新方式根据所传参数决定
    refresh_all_kinds: function(refresh_type) {
        if (refresh_type === this.refresh_type.INIT || refresh_type === this.refresh_type.OUTER_REFRESH) {
            // 将页数设为第一页
            this.current_page = 1;
        }
        var ajax_params;
        if (this.sort == 'back' && this.sort_name) {
            // 后台排序 ，并且有排序相关参数
            ajax_params = {
                page: this.current_page,
                number: this.dataLimit,
                sort_name: this.sort_name,
                sort_method: this.sort_method
            };
        } else {
            ajax_params = {
                page: this.current_page,
                number: this.dataLimit
            };
        }
        $.extend(ajax_params, this.searchTerms);

        var _this = this;
        $.ajax({
            url: this.url,
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(ajax_params),
            success: function(res) {
                // 获取新数据、新数据总数
                _this.data = res.data;
                _this.count = res.count;


                // 如果在前台排序，刷新表格后，为了维持和之前一样的排序效果，需要先对data排序
                _this.refresh_frontSort_effectes();

                switch (refresh_type) {
                    case _this.refresh_type.INIT:
                        // 初始化
                        // 重置"选择项"
                        _this.reset_selected();
                        break;
                    case _this.refresh_type.PAGE_CHANGE:
                        // 由分页操作引起的刷新
                        break;
                    case _this.refresh_type.OUTER_REFRESH:
                        // 外部调用刷新
                        // 重置"选择项"
                        _this.reset_selected();
                        break;
                    case _this.refresh_type.BACKEND_SORT:
                        // 后台排序引起的刷新
                        break;
                }
                // 搭建html（包括table+分页）
                _this.build_html();

                // 更新页数范围
                _this.refresh_page_range();

                setTimeout(function() {
                    // 更新单选、多选的视觉效果
                    _this.refresh_selected_visualEffects();
                    // 绑定所有事件
                    _this.bind_events();
                }, 0);
            },
            error: function() {
                alert('读取失败');
            },
        });
    },
    // 更新单选、多选的视觉效果
    refresh_selected_visualEffects: function() {
        // 当前页的所有数据行(tbody中)
        var current_page_tr = this.container.find('.x-table tr').not(".x-detail");
        current_page_tr.removeClass('selected');
        var _this = this;
        // 单选模式
        if (this.selection.type === 'radio') {
            this.container.find('input[name="x-input-radio"]').prop('checked', false);
            // 如果单选的内容在当前页
            current_page_tr.each(function(index, tr) {
                var first_pid_value = $(tr).attr("x-" + _this.selection.pid[0]);
                if ($.inArray(first_pid_value, _this.selected_firstPid) !== -1) {
                    // 单选选中内容在当前页
                    $(tr).find('input[name="x-input-radio"]').prop('checked', true);
                    $(tr).addClass('selected');
                }
            });
        }
        // 多选模式
        else if (this.selection.type === 'checkbox') {
            this.container.find('input[name="x-input-checkbox"]').prop('checked', false);
            // 如果多选的内容在当前页
            current_page_tr.each(function(index, tr) {
                var first_pid_value = $(tr).attr("x-" + _this.selection.pid[0]);
                if ($.inArray(first_pid_value, _this.selected_firstPid) !== -1) {
                    // 多选选中内容在当前页
                    $(tr).find('input[name="x-input-checkbox"]').prop('checked', true);
                    $(tr).addClass('selected');
                }
            });
            // 全选按钮
            if (this.selection.colomn_shown) {
                this.container.find('.x-table input[name="x-input-checkbox-all"]').prop('checked', true);
                this.container.find('.x-table input[name="x-input-checkbox"]').each(function(index, el) {
                    if ($(el).prop('checked') === false) {
                        _this.container.find('input[name="x-input-checkbox-all"]').prop('checked', false);
                    }
                });
            }
        }
    },

    // 刷新表格后，需要维持和之前一样的排序效果。
    // 如果是前台排序：需要在ajax得到data后对data重新排序，再搭建html
    // 后台排序：只需要在ajax请求时，加上排序相关参数
    refresh_frontSort_effectes: function() {
        var _this = this;
        if (this.sort === 'front') {
            // 排序思路：将data排序，重刷表格
            switch (this.sort_method) {
                case 'original':
                    // 之前的排序是0（不排）。现在仍然不排
                    break;
                case 'asc':
                    // 之前的排序是1（升序）。现在仍然是1（升序）
                    _this.data.sort(function(data1, data2) {
                        if (data1[_this.sort_name] > data2[_this.sort_name]) {
                            return 1;
                        } else {
                            return -1;
                        }
                    });
                    break;
                case 'desc':
                    // 之前的排序是2（降序）。现在仍然是2（降序）
                    _this.data.sort(function(data1, data2) {
                        if (data1[_this.sort_name] > data2[_this.sort_name]) {
                            return -1;
                        } else {
                            return 1;
                        }
                    });
                    break;
            }
        }
    },
    /*
     *      
     *  --------- 2 非核心逻辑函数 ---------
     *  
     *   add_style()：添加css样式，加在style标签中，style标签放到body末尾
     *   clear_selected()：清除所有已选项
     *   refresh_page_change()：进行任何分页操作时，调用该函数来刷新   
     *   refresh_frontEnd_sort()：前端排序时，调用该函数来刷新
     *   refresh_backEnd_sort()：后端排序时，调用该函数来刷新
     *   bind_event_select()：【绑定事件】单选、多选效果
     *   bind_event_detail()：【绑定事件】点击"+"显示详情
     *   bind_event_sort()：【绑定事件】点击表头排序
     *   bind_event_page()：【绑定事件】分页相关事件
     *  
     *  ------------------------------ 
     *      
     */
    // 添加css样式：加在style标签中，style标签放到body末尾
    add_style: function() {
        var style = `
        <!-- table组件的css -->
        <style id="table-css">
        table.x-table {
            border-collapse: collapse;
            width: 100%;
            background:white;
        }
        /*自动序号、单选、多选：文字居中*/
        table.x-table .x-index,table.x-table .x-radio,table.x-table .x-checkbox{
            text-align: center;
        }
        /*th*/
        table.x-table th{
            background: #009de1;
            color: #fff;
            text-align: center;
            height: 30px;            
            font-size: 13px;
            padding: 0;
        }
        /*td*/
        table.x-table td{
            color: #646464;
            text-align: center;
            border-bottom: 1px dashed #cfcfcf;
            height: 35px;
            font-size: 14px;
            padding: 0;
            cursor:pointer;
        }
        /*多选时，表头的全选按钮*/
        table.x-table thead input[name="x-input-checkbox-all"]{
            margin-top:5px;
        }
        /*增删改按钮*/
        table.x-table td a,table.x-table td input[type='button']{
            display: inline-block;
            background: #ff9600;
            color: #fff;
            padding: 3px 10px;
            margin: 0 5px;
            border-radius: 3px;
            text-decoration: none;
        }
        /*添加了排序功能的列的th*/
        table.x-table th[sort]{
            cursor: pointer;
            position:relative;
        }
        table.x-table th[sort]>i{
            position: relative;
            display: inline-block;
            width: 16px;
            height: 18px;
            top: 3px;
            left: 5px;
            vertical-align: top;
            background:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAkklEQVQoU7WS2Q0CMQxEnzuASoAK2BIoiY4QFcB2AJVAB4PGOFI4JPJDfmzHfo6PBHUkLYCTzYjYWEq6WDQ7feVowesC2r16O/UucwaPAGdgC1yB1QiwByZgB9x+Aq2M6uWlZkmfPfwFAJbAAZhzfN0uvpYEeB+e4nEUcE5PcRoFnsER93fAT/tr5BLra1jNYCsPDaRqRFZ8Da0AAAAASUVORK5CYII=") no-repeat 0 0;
        }
        /*  "详情+" 列*/
        table.x-table td.x-detail-btn{
            font-weight:bold;
            font-size:20px;
            color:#097abf;
        }
        table.x-table td.x-detail-btn:hover{
            color:#60c3ff;
        }        
        /*自动换行*/
        table.x-table th,table.x-table td{
            word-break:break-all;
            word-wrap:break-word;
        }
        /*选中效果*/
        table.x-table .selected td {
            background-color: #ffeee2;
        }
        /*底部分页*/
        .x-table-page{
            line-height: 50px;
            color: #646464;
            font-size: 13px;
            position: relative;
            padding-left:20px;       
        }
        .x-table-page .x-table-page-right{
            position: absolute;
            right: 0;
            top: 0;
        }
        .x-table-page a{
            padding: 2px 7px;
            border: 1px solid #ccc;
            margin: 0 5px;
            color: #555;
            text-decoration: none;
            vertical-align: top;
            display: inline;
            cursor:pointer;
        }
        .x-table-page input[type="text"]{
            width: 23px;
            height: 19px;
            border: 1px solid #ccc;
        }
        </style>`;
        $('body').append(style);
    },
    // 清除所有已选项
    clear_selected: function() {
        if (confirm('确定清除所有已选项?')) {
            // 重置"选择项"
            this.reset_selected();
            this.refresh_selected_visualEffects();
        }
    },
    // 进行任何分页操作时，调用该函数来刷新
    refresh_page_change: function() {
        this.refresh_all_kinds(this.refresh_type.PAGE_CHANGE);
    },
    // 前台排序时，调用该函数来刷新
    refresh_frontEnd_sort: function() {
        // 搭建html（包括table+分页）
        this.build_html();
        var _this = this;
        setTimeout(function() {
            // 更新单选、多选的视觉效果
            _this.refresh_selected_visualEffects();
            // 绑定所有事件
            _this.bind_events();
        }, 0);
    },
    // 后台排序时，调用该函数来刷新
    refresh_backEnd_sort: function() {
        this.refresh_all_kinds(this.refresh_type.BACKEND_SORT);
    },

    // 【绑定事件】单选、多选效果
    bind_event_select: function() {
        var clickableTd = this.container.find(".x-table>tbody td:not('[crud]')");
        var _this = this;
        // 思路：根据每个tr的pid来判定是否选中
        if (this.selection.type === 'radio') {
            // 单选效果
            clickableTd.click(function() {
                var td = this;
                var info = {};
                $.each(_this.selection.pid, function(index, pid) {
                    info[pid] = $(td).parents('tr').attr("x-" + pid);
                });
                // 存储所有选中data的所有信息，格式[{x1:x11,y1:y11}]
                _this.selected_info = [info];

                // 存储所有选中data的第一个pid指定的信息，格式[x11]
                // 目的：为了判断选中状态时方便
                var info_firstPid = $(td).parents('tr').attr("x-" + _this.selection.pid[0]);
                _this.selected_firstPid = [info_firstPid];

                // 更新单选、多选的视觉效果
                _this.refresh_selected_visualEffects();
            });
        } else if (this.selection.type === 'checkbox') {
            // 多选效果
            clickableTd.click(function() {
                var td = this;
                var info = {};
                $.each(_this.selection.pid, function(index, pid) {
                    info[pid] = $(td).parents('tr').attr("x-" +pid);
                });
                // 取第一个pid对应的值，判断它是否在_this.selected_firstPid中，以此来判断改行数据之前是否被选中
                var info_firstPid = $(td).parents('tr').attr("x-" +_this.selection.pid[0]);

                // 新数据在选中数据中的位置
                var position = $.inArray(info_firstPid, _this.selected_firstPid);
                if (position === -1) {
                    // 之前没有，点一下后选中
                    _this.selected_firstPid.push(info_firstPid);
                    _this.selected_info.push(info);
                } else {
                    // 之前有，点一下后取消选中
                    _this.selected_firstPid.splice(position, 1);
                    _this.selected_info.splice(position, 1);
                }
                // 更新单选、多选的视觉效果
                _this.refresh_selected_visualEffects();
            });
            // 当前页全选的功能
            if (_this.selection.colomn_shown) {
                var btn = this.container.find('.x-table input[name="x-input-checkbox-all"]');
                var btns = this.container.find('.x-table input[name="x-input-checkbox"]');
                btn.click(function() {
                    var state = btn.prop('checked');
                    btns.each(function(index, el) {
                        if ($(el).prop('checked') !== state) {
                            $(el).trigger('click');
                        }
                    });
                });
            }
        }
    },
    // 【绑定事件】点击"+"显示详情
    bind_event_detail: function() {
        var detailBtns = this.container.find(".x-table>tbody td.x-detail-btn");
        var _this = this;
        detailBtns.click(function() {
            if ($(this).attr('show') === "0") {
                // 之前是没展开。点一下变成展开
                $(this).text("-");
                $(this).attr('show', '1');
                // 当前行
                var tr = $(this).parents("tr");
                // 当前行在table中的位置
                var position = _this.container.find(".x-table>tbody tr").index(tr);
                // 当前行在数据行table中的位置       
                var x_index = _this.container.find(".x-table>tbody tr").not(".x-detail").index(tr);
                // formatter处理过后的内容
                var content = _this.detail.formatter(x_index);
                var detail_tr = `<tr class="x-detail"><td witdh=${_this.detail.width}%></td><td colspan="999">${content}</td></tr>`;
                tr.after(detail_tr);
            } else {
                // 之前是展开。点一下变成不展开
                $(this).text("+");
                $(this).attr('show', '0');
                var tr = $(this).parents("tr");
                // 当前行在table中的位置
                var position = _this.container.find(".x-table>tbody tr").index(tr);
                // detail行
                var detail_tr = _this.container.find(".x-table>tbody tr").eq(position + 1);
                detail_tr.remove();
            }

        });
    },
    // 【绑定事件】点击表头排序
    bind_event_sort: function() {
        var _this = this;
        switch (this.sort) {
            // 前台排序
            case 'front':
                var front_th = _this.container.find('.x-table th[sort]');
                front_th.click(function() {
                    // 排序思路：将data排序，重刷表格            
                    _this.sort_name = $(this).attr('keyName');;
                    var index = _this.container.find('.x-table th[sort]').index($(this));
                    switch (_this.sort_methods[index]) {
                        case 0:
                            // 现在是0（不排）。变成1升序排
                            _this.sort_methods[index] = 1;
                            _this.sort_method = 'asc';
                            _this.data.sort(function(data1, data2) {
                                if (data1[_this.sort_name] > data2[_this.sort_name]) {
                                    return 1;
                                } else {
                                    return -1;
                                }
                            });
                            break;
                        case 1:
                            // 现在是1（升序）。变成2降序排
                            _this.sort_methods[index] = 2;
                            _this.sort_method = 'desc';
                            _this.data.sort(function(data1, data2) {
                                if (data1[_this.sort_name] > data2[_this.sort_name]) {
                                    return -1;
                                } else {
                                    return 1;
                                }
                            });
                            break;
                        case 2:
                            // 现在是2（降序）。变成1升序排
                            _this.sort_methods[index] = 1;
                            _this.sort_method = 'asc';
                            _this.data.sort(function(data1, data2) {
                                if (data1[_this.sort_name] > data2[_this.sort_name]) {
                                    return 1;
                                } else {
                                    return -1;
                                }
                            });
                    }
                    _this.refresh_frontEnd_sort();
                });
                break;
                // 后台排序
            case 'back':
                var back_th = _this.container.find('.x-table th[sort]');
                back_th.click(function() {
                    _this.sort_name = $(this).attr('keyName');;
                    var index = _this.container.find('.x-table th[sort]').index($(this));
                    switch (_this.sort_methods[index]) {
                        case 0:
                            // 现在是0（不排）。变成1升序排
                            _this.sort_methods[index] = 1;
                            _this.sort_method = 'asc';
                            break;
                        case 1:
                            // 现在是1（升序）。变成2降序排
                            _this.sort_methods[index] = 2;
                            _this.sort_method = 'desc';
                            break;
                        case 2:
                            // 现在是2（降序）。变成1升序排
                            _this.sort_methods[index] = 1;
                            _this.sort_method = 'asc';
                    }
                    _this.refresh_backEnd_sort();
                });
                break;
        }
    },
    // 【绑定事件】分页相关事件
    bind_event_page: function() {
        var _this = this;
        // 分页："每页条数"发生变化时
        _this.container.find(`.x-table-page select`).change(function() {
            _this.dataLimit = parseInt($(this).val());
            //将页数设为第一页
            _this.current_page = 1;
            _this.refresh_page_change();
        });
        // 分页：上一页
        _this.container.find('.x-table-page-right-prev').click(function() {
            if (_this.current_page === 1) {
                alert('当前页是第一页');
            } else {
                _this.current_page--;
                _this.refresh_page_change();
            }
        });
        // 分页：下一页
        _this.container.find('.x-table-page-right-next').click(function() {
            var total_page = Math.ceil(_this.count / _this.dataLimit);
            if (total_page === 0) {
                total_page = 1;
            }
            if (_this.current_page === total_page) {
                alert('当前页是最后一页');
            } else {
                _this.current_page++;
                _this.refresh_page_change();
            }
        });
        // 分页：跳转
        _this.container.find('.x-table-page-right-jump').click(function() {
            var page = parseInt(_this.container.find('.x-table-page-right-page').val());
            var total_page = Math.ceil(_this.count / _this.dataLimit);
            if (total_page === 0) {
                total_page = 1;
            }
            if (page >= 1 && page <= total_page) {
                if (page !== _this.current_page) {
                    _this.current_page = page;
                    _this.refresh_page_change();
                }
            } else {
                alert(`无效输入，页码范围：[1,${total_page}]`);
            }
        });
        // 分页：清除所有选择项
        _this.container.find('.x-table-page-clear-all').click(function() {
            _this.clear_selected();
        });
    },

    /*
     * 
     *  --------- 3 辅助 ---------
     *  
     *  
     *  
     *   refresh_page_range()：更新页数范围
     *   reset_sort_methods()：初始化"排序方式"
     *   reset_selected()：重置"选择项"
     *   refresh_type：刷新方式（常量）
     *  
     *  
     *  
     *  ------------------------------ 
     *      
     */

    // 更新页数范围
    refresh_page_range: function() {
        // 当前页中的第一条数据，是总起第几条
        this.current_page_min = (this.current_page - 1) * this.dataLimit + 1;
        // 当前页中的最后一条数据，是总起第几条
        this.current_page_max = this.current_page_min + this.data.length - 1;
    },

    // 初始化"排序方式"
    reset_sort_methods: function() {
        // 将所有排序列的sort_method，初始化为0 [0:original;1:asc;2:desc]
        this.sort_methods = [];
        for (var i = 0; i < this.title.length; i++) {
            if (this.title[i].sort) {
                this.sort_methods.push(0);
            }
        }
        this.sort_method = 'original';
    },

    // 重置"选择项"
    reset_selected: function() {
        this.selected_firstPid = [];
        this.selected_info = [];
    },
    // 刷新方式（refresh_all_kinds函数据此判断刷新方式）
    refresh_type: {
        // 初始化
        INIT: 1,
        // 由分页操作引起的刷新
        PAGE_CHANGE: 2,
        // 外部调用刷新
        OUTER_REFRESH: 3,
        // 后台排序引起的刷新
        BACKEND_SORT: 4,
    },

    // 
    // 修正constructor指向
    constructor: Table

}
