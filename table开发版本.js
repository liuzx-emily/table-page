function Table(init_params) {
    // 容器ID【必填】
    this.container = $("#" + init_params.container_id);

    // ajax请求数据的地址【必填】
    this.ajax_url = init_params.url;

    // 每条数据的标识符【必填】
    this.pid = init_params.pid;

    // 标题行【必填】
    this.title_bar = init_params.title_bar;

    // 搜索条件【选填】    
    this.search_terms = init_params.search_terms || {};

    // 每页几条数据【选填，默认为10】
    this.each_page_data_number = init_params.each_page_data_number || 10;

    // 功能：自动序号【选填】
    init_params.auto_index = init_params.auto_index || {};
    this.auto_index = {
        _if: init_params.auto_index._if || false,
        _title: init_params.auto_index._title || '序号',
        _width: init_params.auto_index._width || 1
    };

    // 功能：单选、多选【选填】
    init_params.selection = init_params.selection || {};
    this.selection = {
        _type: init_params.selection._type || 'radio', //选填'radio' 'checkbox' 'neither' 
        _colomn_shown: init_params.selection._colomn_shown || false,
        _width: init_params.selection._width || 1,
    };

    // 功能：排序
    // 需要添加排序功能的列【选填】
    this.sorted_colomn = init_params.sorted_colomn || [];
    // 在前台排序【默认为false】
    this.sort_in_front = init_params.sort_in_front || false;

    // 功能：更多信息【选填】    
    init_params.detail = init_params.detail || {};
    this.detail = {
        _key: init_params.detail._key,
        _formatter: init_params.detail._formatter,
        _width: init_params.detail._width || 2
    }

    // 选中的数据的序号 [1,sum]
    this.selected = [];
    // 选中的数据的信息
    this.selected_info = [];

    this.init();
}
Table.prototype = {

    /*
     *      
     *  --------- 0 "对外"的函数 ---------  

     *   【使用者在使用本组件时，可能会手动调用的函数。】
     *   refresh：刷新表格
     *   get_selected：获取所有已选项 
     *  
     *  ------------------------------ 
     *      
     */
    // 刷新表格（"对外"）
    refresh: function(search_terms) {
        if (search_terms) {
            // 有新的搜索条件
            this.search_terms = search_terms
        }

        refresh_all_kinds(Table.refresh_type.OUTER_REFRESH);
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
     *   init：初始化函数
     *   build_html：搭建html（包括table+分页）
     *   bind_events：绑定所有事件
     *   refresh_all_kinds：刷新，具体刷新方式根据所传参数决定
     *      
     *  ---------------------------------- 
     *      
     */
    // 初始化函数
    init: function() {
        // this.container.css('position', 'relative');
        // 添加css
        if ($('style#table-css').length === 0) {
            add_style();
        }

        refresh_all_kinds(Table.refresh_type.INIT);
    },
    // 搭建html（包括table+分页）
    build_html: function() {
        var _this = this;
        var table_html = `
        <table class="x-table">
            <thead>
                <tr>`;
        if (_this.detail) {
            table_html += `<th width=${_this.detail._width}% class="x-detail-btn"></th>`;
        }
        table_html += `
                    ${_this.auto_index._if?`<th width=${_this.auto_index._width}% class="x-index">${_this.auto_index._title}</th>`:``}
                    ${_this.selection._type==='radio'&&_this.selection._colomn_shown===true?`<th width=${_this.selection._width}% class="x-radio"></th>`:``}
                    ${_this.selection._type==='checkbox'&&_this.selection._colomn_shown===true?`<th width=${_this.selection._width}% class="x-checkbox"><input type="checkbox" name="x-input-checkbox-all"></th>`:``}`;
        $.each(_this.title_bar, function(index, each_title) {
            if (typeof each_title.show === "undefined" || each_title.show) {
                table_html += `
                <th width="${each_title.width}%" keyName="${each_title.key}">${each_title.name}<i></i></th>`;
            }
        });
        table_html += `</tr>
            </thead>
            <tbody>`;

        if (_this.data.length === 0) {
            // 无数据
            table_html += `<tr><td colspan="999" style="font-weight:bold;">暂无数据!</td></tr>`;
        } else {
            // 有数据
            $.each(_this.data, function(index, each_data) {
                table_html += `
                    <tr `;
                $.each(_this.pid, function(index, pid) {
                    table_html += ' ' + pid + '=' + each_data[pid];
                });
                table_html += `>`;
                // 有"详情+"列
                if (_this.detail) {
                    table_html += `<td class='x-detail-btn' operation>+</td>`;
                }
                table_html += `
                        ${_this.auto_index._if?`<td class="x-index">${index+1}</td>`:``}
                        ${_this.selection._type==='radio'&&_this.selection._colomn_shown===true?`
                        <td class="x-radio">
                            <input type="radio" name="x-input-radio">
                        </td>`:``}
                        ${_this.selection._type==='checkbox'&&_this.selection._colomn_shown===true?`
                        <td class="x-checkbox">
                            <input type="checkbox" name="x-input-checkbox">
                        </td>`:``}`;
                $.each(_this.title_bar, function(index, each_title) {
                    if (typeof each_title.show === "undefined" || each_title.show) {
                        var td_data = each_data[each_title.key];
                        if (each_title.formatter) {
                            // 有formatter
                            td_data = each_title.formatter(td_data);
                        }
                        if (each_title.operation) {
                            // 是"操作类"单元格(有operation属性，没有title属性)
                            table_html += '<td operation ' + (each_title.css ? ' style=' + each_title.css : '') + '>' + td_data + '</td>';
                        } else {
                            // 普通单元格(没有operation属性，有title属性)
                            table_html += '<td' + (each_title.css ? ' style=' + each_title.css : '') + ' title="' + td_data + '">' + td_data + '</td>';
                        }
                    }
                });
                table_html += `
                </tr>
                `;
            });
        }

        table_html += `</tbody>
        </table>
        <div class="x-table-page">
            <select>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
            </select>
            共${_this.sum}条数据（当前第${_this.current_page}/${Math.ceil(_this.sum/_this.each_page_data_number)||1}页）`;
        if (_this.selection._type === 'checkbox') {
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
        _this.container.find(`.x-table-page select option[value=${_this.each_page_data_number}]`).prop('selected', 'true');
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
    // 刷新，具体刷新方式根据所传参数决定
    refresh_all_kinds: function(refresh_type, backEnd_sort_params) {

        if (refresh_type !== Table.refresh_type.PAGE_CHANGE) {
            // 将页数设为第一页
            this.current_page = 1;
        }

        var ajax_params;
        if (refresh_type === Table.refresh_type.BACKEND_SORT) {
            ajax_params = backEnd_sort_params;
        } else {
            ajax_params = {
                page: this.current_page,
                number: this.each_page_data_number
            };
        }
        $.extend(ajax_params, this.search_terms);

        var _this = this;
        $.ajax({
            url: this.ajax_url,
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(ajax_params),
            success: function(res) {
                // 获取新数据、新数据总数
                _this.data = res.data;
                _this.sum = res.count;

                switch (refresh_type) {
                    case 1:
                        // INIT：初始化
                        break;
                    case 2:
                        // PAGE_CHANGE：由分页操作引起的刷新
                        break;
                    case 3:
                        // OUTER_REFRESH：外部调用刷新
                        _this.selected = [];
                        _this.selected_info = [];
                        break;
                    case 4:
                        //后台排序引起的刷新
                        _this.selected = [];
                        _this.selected_info = [];
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

    },

    /*
     *      
     *  --------- 2 非核心逻辑函数 ---------
     *  
     *   add_style：添加css样式，加在style标签中，style标签放到body末尾
     *   clear_selected：清除所有已选项
     *   refresh_page_change：进行任何分页操作时，调用该函数    
     *   refresh_backEnd_sort：后端排序时，调用该函数来刷新
     *   bind_event_select：绑定单选、多选
     *   bind_event_detail：绑定"详情+"
     *   bind_event_sort：绑定排序
     *   bind_event_page：绑定分页相关事件
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
        }
        /*添加了排序功能的列的th*/
        table.x-table th.sorted{
            cursor: pointer;
            position:relative;
        }
        table.x-table th.sorted>i{
            position: relative;
            display: inline-block;
            width: 16px;
            height: 18px;
            top: 7px;
            left: 5px;
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
            this.selected = [];
            this.selected_info = [];
            this.refresh_selected_visualEffects();
        }
    },
    // 进行任何分页操作时，调用该函数来刷新
    refresh_page_change: function() {
        refresh_all_kinds(Table.refresh_type.PAGE_CHANGE);
    },
    // 后台排序时，调用该函数来刷新
    refresh_backEnd_sort: function(sort_name, sort_method) {
        var backEnd_sort_params = {
            page: this.current_page,
            number: this.each_page_data_number,
            sort_name: sort_name,
            sort_method: sort_method
        };
        refresh_all_kinds(Table.refresh_type.BACKEND_SORT, backEnd_sort_params);
    },

    // 绑定单选、多选
    bind_event_select: function() {

    };
    // 绑定"详情+"
    bind_event_detail: function() {

    };
    // 绑定排序
    bind_event_sort: function() {

    };
    // 绑定分页相关事件
    bind_event_page: function() {
        var _this=this;
        // 分页："每页条数"发生变化时
        _this.container.find(`.x-table-page select`).change(function() {
            _this.each_page_data_number = parseInt($(this).val());
            //将页数设为第一页
            _this.current_page = 1;
            _this.page_change();
        });
        // 分页：上一页
        _this.container.find('.x-table-page-right-prev').click(function() {
            if (_this.current_page === 1) {
                alert('当前页是第一页');
            } else {
                _this.current_page--;
                _this.page_change();
            }
        });
        // 分页：下一页
        _this.container.find('.x-table-page-right-next').click(function() {
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
        _this.container.find('.x-table-page-right-jump').click(function() {
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
                alert(`无效输入，页码范围：[1,${total_page}]`);
            }
        });
        // 分页：清除所有选择项
        _this.container.find('.x-table-page-clear-all').click(function() {
            _this.clear_selected();
        });
    };

    /*
     * 
     *  --------- 3 辅助 ---------
     *  
     *  
     *  
     *   refresh_page_range：更新页数范围
     *  
     *  
     *  
     *  
     *  ------------------------------ 
     *      
     */

    // 修正constructor指向
    constructor: Table,

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

    // 更新页数范围
    refresh_page_range: function() {
        // 当前页中的第一条数据，是总起第几条
        this.current_page_min = (this.current_page - 1) * this.each_page_data_number + 1;
        // 当前页中的最后一条数据，是总起第几条
        this.current_page_max = this.current_page_min + this.data.length - 1;
    },

}