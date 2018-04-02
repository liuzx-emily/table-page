'use strict';function Table(a){this.container=$('#'+a.id),this.url=a.url,this.title=a.title,this.searchTerms=a.searchTerms||{},this.dataLimit=a.dataLimit||10,this.dataLimits=a.dataLimits||[5,10,20,50],a.auto_index=a.auto_index||{},this.auto_index={show:a.auto_index.show||!1,title:a.auto_index.title||'\u5E8F\u53F7',width:a.auto_index.width||2},a.selection=a.selection||{},this.selection={type:a.selection.type||'',pid:a.selection.pid,colomn_shown:a.selection.colomn_shown||!1,width:a.selection.width||2},this.sort=a.sort||'front',a.detail=a.detail||{},this.detail={key:a.detail.key,width:a.detail.width||2,formatter:a.detail.formatter},this.init()}Table.prototype={refresh:function refresh(a){a&&(this.searchTerms=a),this.refresh_all_kinds(this.refresh_type.OUTER_REFRESH)},get_selected:function get_selected(a){var b=[];return $.each(this.selected_info,function(c,d){b.push(d[a])}),b},init:function init(){0===$('style#table-css').length&&this.add_style(),this.reset_sort_methods(),this.refresh_all_kinds(this.refresh_type.INIT)},build_html:function build_html(){var a=this,b='\n        <table class="x-table">\n            <thead>\n                <tr>\n            '+(a.detail.formatter?'<th width="'+a.detail.width+'%" class="x-detail-btn"></th>':'')+'\n            '+(a.auto_index.show?'<th width="'+a.auto_index.width+'%" class="x-index">'+a.auto_index.title+'</th>':'')+'\n            '+('radio'==a.selection.type&&a.selection.colomn_shown?'<th width="'+a.selection.width+'%" class="x-radio"></th>':'')+'\n            '+('checkbox'==a.selection.type&&a.selection.colomn_shown?'<th width="'+a.selection.width+'%" class="x-checkbox"><input type="checkbox" name="x-input-checkbox-all"></th>':'');$.each(a.title,function(c,d){b+='\n            <th width="'+d.width+'%" '+(d.key?'keyName="'+d.key+'"':'')+' '+(d.sort?'sort':'')+'>'+d.name+'<i></i></th>'}),b+='\n                </tr>\n            </thead>\n            <tbody>',0===a.data.length?b+='<tr><td colspan="999" style="font-weight:bold;">\u6682\u65E0\u6570\u636E!</td></tr>':$.each(a.data,function(c,d){b+='\n                    <tr ',a.selection.pid&&$.each(a.selection.pid,function(e,f){b+='x-'+f+'="'+d[f]+'"'}),b+='>',b+='\n                        '+(a.detail.formatter?'<td class="x-detail-btn" show=0 crud>+</td>':'')+'\n                        '+(a.auto_index.show?'<td class="x-index">'+(c+1)+'</td>':'')+'\n                        '+('radio'===a.selection.type&&!0===a.selection.colomn_shown?'\n                        <td class="x-radio">\n                            <input type="radio" name="x-input-radio">\n                        </td>':'')+'\n                        '+('checkbox'===a.selection.type&&!0===a.selection.colomn_shown?'\n                        <td class="x-checkbox">\n                            <input type="checkbox" name="x-input-checkbox">\n                        </td>':''),$.each(a.title,function(e,f){if(f.crud)b+='<td crud>'+f.formatter(c)+'</td>';else{var g=d[f.key];f.formatter&&(g=f.formatter(g)),b+='<td title="'+g+'">'+g+'</td>'}}),b+='</tr>'}),b+='</tbody>\n        </table>\n        <div class="x-table-page">\n            <select>',$.each(a.dataLimits,function(c,d){b+='<option value="'+d+'">'+d+'</option>'}),b+='</select>\n            \u5171'+a.total+'\u6761\u6570\u636E\uFF08\u5F53\u524D\u7B2C'+a.current_page+'/'+(Math.ceil(a.total/a.dataLimit)||1)+'\u9875\uFF09','checkbox'===a.selection.type&&(b+='\n                <a class="x-table-page-clear-all">\u5168\u90E8\u53D6\u6D88</a>'),b+='\n            <div class="x-table-page-right">\n                <a class="x-table-page-right-prev">&lt;</a>\n                <a class="x-table-page-right-next">&gt;</a>\n                \u7B2C\n                <input type="text" class="x-table-page-right-page">\u9875\n                <a class="x-table-page-right-jump">\u8F6C\u5230</a>\n            </div>\n        </div>',a.container.html(b),a.container.find('.x-table-page select option[value='+a.dataLimit+']').prop('selected','true')},bind_events:function bind_events(){this.bind_event_select(),this.bind_event_detail(),this.bind_event_sort(),this.bind_event_page()},refresh_all_kinds:function refresh_all_kinds(a){(a===this.refresh_type.INIT||a===this.refresh_type.OUTER_REFRESH)&&(this.current_page=1);var b;b='back'==this.sort&&this.sort_name?{page:this.current_page,row:this.dataLimit,sort_name:this.sort_name,sort_method:this.sort_method}:{page:this.current_page,row:this.dataLimit},$.extend(b,this.searchTerms);var c=this;$.ajax({url:this.url,type:'POST',dataType:'json',contentType:'application/json',data:JSON.stringify(b),success:function success(d){switch(c.data=d.data,c.total=d.total,c.refresh_frontSort_effectes(),a){case c.refresh_type.INIT:c.reset_selected();break;case c.refresh_type.PAGE_CHANGE:break;case c.refresh_type.OUTER_REFRESH:c.reset_selected();break;case c.refresh_type.BACKEND_SORT:}c.build_html(),c.refresh_page_range(),setTimeout(function(){c.refresh_selected_visualEffects(),c.bind_events()},0)},error:function error(){alert('\u8BFB\u53D6\u5931\u8D25')}})},refresh_selected_visualEffects:function refresh_selected_visualEffects(){var a=this.container.find('.x-table tr').not('.x-detail');a.removeClass('selected');var b=this;'radio'===this.selection.type?(this.container.find('input[name="x-input-radio"]').prop('checked',!1),a.each(function(c,d){var e=$(d).attr('x-'+b.selection.pid[0]);-1!==$.inArray(e,b.selected_firstPid)&&($(d).find('input[name="x-input-radio"]').prop('checked',!0),$(d).addClass('selected'))})):'checkbox'===this.selection.type&&(this.container.find('input[name="x-input-checkbox"]').prop('checked',!1),a.each(function(c,d){var e=$(d).attr('x-'+b.selection.pid[0]);-1!==$.inArray(e,b.selected_firstPid)&&($(d).find('input[name="x-input-checkbox"]').prop('checked',!0),$(d).addClass('selected'))}),this.selection.colomn_shown&&(this.container.find('.x-table input[name="x-input-checkbox-all"]').prop('checked',!0),this.container.find('.x-table input[name="x-input-checkbox"]').each(function(c,d){!1===$(d).prop('checked')&&b.container.find('input[name="x-input-checkbox-all"]').prop('checked',!1)})))},refresh_frontSort_effectes:function refresh_frontSort_effectes(){var a=this;if('front'===this.sort)switch(this.sort_method){case'original':break;case'asc':a.data.sort(function(b,c){return b[a.sort_name]-c[a.sort_name]});break;case'desc':a.data.sort(function(b,c){return c[a.sort_name]-b[a.sort_name]});}},add_style:function add_style(){$('body').append('\n        <!-- table\u7EC4\u4EF6\u7684css -->\n        <style id="table-css">\n        table.x-table {\n            border-collapse: collapse;\n            width: 100%;\n            background:white;\n        }\n        /*\u81EA\u52A8\u5E8F\u53F7\u3001\u5355\u9009\u3001\u591A\u9009\uFF1A\u6587\u5B57\u5C45\u4E2D*/\n        table.x-table .x-index,table.x-table .x-radio,table.x-table .x-checkbox{\n            text-align: center;\n        }\n        /*th*/\n        table.x-table th{\n            background: #009de1;\n            color: #fff;\n            text-align: center;\n            height: 30px;            \n            font-size: 13px;\n            padding: 0;\n        }\n        /*td*/\n        table.x-table td{\n            color: #646464;\n            text-align: center;\n            border-bottom: 1px dashed #cfcfcf;\n            height: 35px;\n            font-size: 14px;\n            padding: 0;\n            cursor:pointer;\n        }\n        /*\u591A\u9009\u65F6\uFF0C\u8868\u5934\u7684\u5168\u9009\u6309\u94AE*/\n        table.x-table thead input[name="x-input-checkbox-all"]{\n            margin-top:5px;\n        }\n        /*\u589E\u5220\u6539\u6309\u94AE*/\n        table.x-table td a,table.x-table td input[type=\'button\']{\n            display: inline-block;\n            background: #ff9600;\n            color: #fff;\n            padding: 3px 10px;\n            margin: 0 5px;\n            border-radius: 3px;\n            text-decoration: none;\n        }\n        /*\u6DFB\u52A0\u4E86\u6392\u5E8F\u529F\u80FD\u7684\u5217\u7684th*/\n        table.x-table th[sort]{\n            cursor: pointer;\n            position:relative;\n        }\n        table.x-table th[sort]>i{\n            position: relative;\n            display: inline-block;\n            width: 16px;\n            height: 18px;\n            top: 3px;\n            left: 5px;\n            vertical-align: top;\n            background:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAkklEQVQoU7WS2Q0CMQxEnzuASoAK2BIoiY4QFcB2AJVAB4PGOFI4JPJDfmzHfo6PBHUkLYCTzYjYWEq6WDQ7feVowesC2r16O/UucwaPAGdgC1yB1QiwByZgB9x+Aq2M6uWlZkmfPfwFAJbAAZhzfN0uvpYEeB+e4nEUcE5PcRoFnsER93fAT/tr5BLra1jNYCsPDaRqRFZ8Da0AAAAASUVORK5CYII=") no-repeat 0 0;\n        }\n        /*  "\u8BE6\u60C5+" \u5217*/\n        table.x-table td.x-detail-btn{\n            font-weight:bold;\n            font-size:20px;\n            color:#097abf;\n        }\n        table.x-table td.x-detail-btn:hover{\n            color:#60c3ff;\n        }        \n        /*\u81EA\u52A8\u6362\u884C*/\n        table.x-table th,table.x-table td{\n            word-break:break-all;\n            word-wrap:break-word;\n        }\n        /*\u9009\u4E2D\u6548\u679C*/\n        table.x-table .selected td {\n            background-color: #ffeee2;\n        }\n        /*\u5E95\u90E8\u5206\u9875*/\n        .x-table-page{\n            line-height: 50px;\n            color: #646464;\n            font-size: 13px;\n            position: relative;\n            padding-left:20px;       \n        }\n        .x-table-page .x-table-page-right{\n            position: absolute;\n            right: 0;\n            top: 0;\n        }\n        .x-table-page a{\n            padding: 2px 7px;\n            border: 1px solid #ccc;\n            margin: 0 5px;\n            color: #555;\n            text-decoration: none;\n            vertical-align: top;\n            display: inline;\n            cursor:pointer;\n        }\n        .x-table-page input[type="text"]{\n            width: 23px;\n            height: 19px;\n            border: 1px solid #ccc;\n        }\n        </style>')},clear_selected:function clear_selected(){confirm('\u786E\u5B9A\u6E05\u9664\u6240\u6709\u5DF2\u9009\u9879?')&&(this.reset_selected(),this.refresh_selected_visualEffects())},refresh_page_change:function refresh_page_change(){this.refresh_all_kinds(this.refresh_type.PAGE_CHANGE)},refresh_frontEnd_sort:function refresh_frontEnd_sort(){this.build_html();var a=this;setTimeout(function(){a.refresh_selected_visualEffects(),a.bind_events()},0)},refresh_backEnd_sort:function refresh_backEnd_sort(){this.refresh_all_kinds(this.refresh_type.BACKEND_SORT)},bind_event_select:function bind_event_select(){var a=this.container.find('.x-table>tbody td:not(\'[crud]\')'),b=this;if('radio'===this.selection.type)a.click(function(){var e=this,f={};$.each(b.selection.pid,function(h,j){f[j]=$(e).parents('tr').attr('x-'+j)}),b.selected_info=[f];var g=$(e).parents('tr').attr('x-'+b.selection.pid[0]);b.selected_firstPid=[g],b.refresh_selected_visualEffects()});else if('checkbox'===this.selection.type&&(a.click(function(){var e=this,f={};$.each(b.selection.pid,function(j,k){f[k]=$(e).parents('tr').attr('x-'+k)});var g=$(e).parents('tr').attr('x-'+b.selection.pid[0]),h=$.inArray(g,b.selected_firstPid);-1===h?(b.selected_firstPid.push(g),b.selected_info.push(f)):(b.selected_firstPid.splice(h,1),b.selected_info.splice(h,1)),b.refresh_selected_visualEffects()}),b.selection.colomn_shown)){var c=this.container.find('.x-table input[name="x-input-checkbox-all"]'),d=this.container.find('.x-table input[name="x-input-checkbox"]');c.click(function(){var e=c.prop('checked');d.each(function(f,g){$(g).prop('checked')!==e&&$(g).trigger('click')})})}},bind_event_detail:function bind_event_detail(){var a=this.container.find('.x-table>tbody td.x-detail-btn'),b=this;a.click(function(){if('0'===$(this).attr('show')){$(this).text('-'),$(this).attr('show','1');var c=$(this).parents('tr'),d=b.container.find('.x-table>tbody tr').index(c),e=b.container.find('.x-table>tbody tr').not('.x-detail').index(c),f=b.detail.formatter(e),g='<tr class="x-detail"><td witdh='+b.detail.width+'%></td><td colspan="999">'+f+'</td></tr>';c.after(g)}else{$(this).text('+'),$(this).attr('show','0');var c=$(this).parents('tr'),d=b.container.find('.x-table>tbody tr').index(c),g=b.container.find('.x-table>tbody tr').eq(d+1);g.remove()}})},bind_event_sort:function bind_event_sort(){var a=this;switch(this.sort){case'front':var b=a.container.find('.x-table th[sort]');b.click(function(){a.sort_name=$(this).attr('keyName');var d=a.container.find('.x-table th[sort]').index($(this));switch(a.sort_methods[d]){case 0:a.sort_methods[d]=1,a.sort_method='asc',a.data.sort(function(e,f){return e[a.sort_name]-f[a.sort_name]});break;case 1:a.sort_methods[d]=2,a.sort_method='desc',a.data.sort(function(e,f){return f[a.sort_name]-e[a.sort_name]});break;case 2:a.sort_methods[d]=1,a.sort_method='asc',a.data.sort(function(e,f){return e[a.sort_name]-f[a.sort_name]});}a.refresh_frontEnd_sort()});break;case'back':var c=a.container.find('.x-table th[sort]');c.click(function(){a.sort_name=$(this).attr('keyName');var d=a.container.find('.x-table th[sort]').index($(this));switch(a.sort_methods[d]){case 0:a.sort_methods[d]=1,a.sort_method='asc';break;case 1:a.sort_methods[d]=2,a.sort_method='desc';break;case 2:a.sort_methods[d]=1,a.sort_method='asc';}a.refresh_backEnd_sort()});}},bind_event_page:function bind_event_page(){var a=this;a.container.find('.x-table-page select').change(function(){a.dataLimit=parseInt($(this).val()),a.current_page=1,a.refresh_page_change()}),a.container.find('.x-table-page-right-prev').click(function(){1===a.current_page?alert('\u5F53\u524D\u9875\u662F\u7B2C\u4E00\u9875'):(a.current_page--,a.refresh_page_change())}),a.container.find('.x-table-page-right-next').click(function(){var b=Math.ceil(a.total/a.dataLimit);0===b&&(b=1),a.current_page===b?alert('\u5F53\u524D\u9875\u662F\u6700\u540E\u4E00\u9875'):(a.current_page++,a.refresh_page_change())}),a.container.find('.x-table-page-right-jump').click(function(){var b=parseInt(a.container.find('.x-table-page-right-page').val()),c=Math.ceil(a.total/a.dataLimit);0===c&&(c=1),1<=b&&b<=c?b!==a.current_page&&(a.current_page=b,a.refresh_page_change()):alert('\u65E0\u6548\u8F93\u5165\uFF0C\u9875\u7801\u8303\u56F4\uFF1A[1,'+c+']')}),a.container.find('.x-table-page-clear-all').click(function(){a.clear_selected()})},refresh_page_range:function refresh_page_range(){this.current_page_min=(this.current_page-1)*this.dataLimit+1,this.current_page_max=this.current_page_min+this.data.length-1},reset_sort_methods:function reset_sort_methods(){this.sort_methods=[];for(var a=0;a<this.title.length;a++)this.title[a].sort&&this.sort_methods.push(0);this.sort_method='original'},reset_selected:function reset_selected(){this.selected_firstPid=[],this.selected_info=[]},refresh_type:{INIT:1,PAGE_CHANGE:2,OUTER_REFRESH:3,BACKEND_SORT:4},constructor:Table};