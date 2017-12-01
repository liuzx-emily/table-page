
Table.prototype = {
   
    // 绑定所有事件
    bind_events: function() {
        var _this = this;        
        // 单选+多选
        switch (_this.selection._type) {
            case 'radio':
                _this.container.find(">table td:not('[operation]')").click(function() {
                    var _td = this;
                    var info = {
                        index: _this.current_page_sort[$(_td).parents('tr').index()] + _this.current_page_min,
                    };
                    $.each(_this.pid, function(index, pid) {
                        info[pid] = $(_td).parents('tr').attr(pid);
                    });
                    _this.selected_info = [info];
                    _this.selected = [info.index];
                    _this.refresh_radio_and_checkbox();
                });
                break;
            case 'checkbox':
                // 点击主表格中任一单元格，都能选中当前数据行（多选）
                _this.container.find(">table td:not('[operation]')").click(function() {
                    var _td = this;
                    var info = {
                        index: _this.current_page_sort[$(_td).parents('tr').index()] + _this.current_page_min,
                    };
                    $.each(_this.pid, function(index, pid) {
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
                    btn.click(function() {
                        var state = btn.prop('checked');
                        btns.each(function(index, el) {
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
        
        // 详情+
        _this.container.find('>table tbody td.x-detail').click(function() {
            _this.establish_faketable_frame(this);
        });
        _this.container.find('.x-table-page').css('paddingTop', '0px');
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
        $.each(_this.sorted_colomn, function(index, val) {
            _this.container.find('>table th').eq(val + extraColomn - 1).attr('sort_method', 'original');
            _this.container.find('>table th').eq(val + extraColomn - 1).addClass('sorted');
            _this.container.find('>table th').eq(val + extraColomn - 1).click(function() {
                if (_this.sort_in_front === true) {
                    // 在前台排序，只排当前页的数据
                    var old_current_page_sort = _this.current_page_sort;
                    _this.current_page_sort = [];
                    var _index = $(this).index() - extraColomn;
                    var arr = [];
                    $.each(_this.data, function(index, each_data) {
                        var key = _this.title_bar[_index].key;
                        var cell = each_data[key];
                        arr.push(cell);
                    });
                    var original_arr = arr.concat([]);
                    if ($(this).attr('sort_method') === 'original') {
                        // 如果现在是"初始顺序"，则点一下后变成"从小到大"
                        arr.sort(function(a, b) {
                            if (/\d+/.test(a) && /\d+/.test(b)) {
                                return parseInt(a) - parseInt(b);
                            } else {
                                return a > b;
                            }
                        });
                        $.each(arr, function(index, val) {
                            var target = val;
                            $.each(original_arr, function(index, val) {
                                if (target === val && ($.inArray(index, _this.current_page_sort) === -1)) {
                                    _this.current_page_sort.push(index);
                                    return false;
                                }
                            });
                        });
                        $(this).attr('sort_method', 'asc');
                    } else if ($(this).attr('sort_method') === 'asc') {
                        // 如果现在是"从小到大"，则点一下后变成"从大到小"
                        arr.sort(function(a, b) {
                            if (/\d+/.test(a) && /\d+/.test(b)) {
                                return parseInt(b) - parseInt(a);
                            } else {
                                return b > a;
                            }
                        });
                        $.each(arr, function(index, val) {
                            var target = val;
                            $.each(original_arr, function(index, val) {
                                if (target === val && ($.inArray(index, _this.current_page_sort) === -1)) {
                                    _this.current_page_sort.push(index);
                                    return false;
                                }
                            });
                        });
                        $(this).attr('sort_method', 'desc');
                    } else {
                        // 如果现在是"从大到小"，则点一下后变成"初始顺序"
                        $.each(arr, function(index, val) {
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
                    $.each(row, function(index, val) {
                        _this.container.find('>table tbody').append(val);
                    });
                    // 序号重新排序
                    _this.container.find('>table td.x-index').each(function(index, el) {
                        $(el).html(index + 1);
                    });
                } else {
                    // 后台排序（整个数据库排）
                    var keyName=$(this).attr('keyName');
                    switch($(this).attr('sort_method')){
                        case 'original':
                            _this.sort_refresh(keyName,'asc');
                            $(this).attr('sort_method', 'asc');
                            break;
                        case 'asc':
                            _this.sort_refresh(keyName,'desc');
                            $(this).attr('sort_method', 'desc');
                            break;
                        case 'desc':                            
                            _this.sort_refresh(keyName,'original');
                            $(this).attr('sort_method', 'original');
                            break;
                    }
                }
            });
        });
        
    },
    refresh_radio_and_checkbox: function() {
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
            $.each(this.selected, function(index, val) {
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
                this.container.find('input[name="x-input-checkbox"]').each(function(index, el) {
                    if ($(el).prop('checked') === false) {
                        _this.container.find('input[name="x-input-checkbox-all"]').prop('checked', false);
                    }
                });
            }
        }
    },


};