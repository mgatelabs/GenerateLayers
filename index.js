(function(){

    window.MG = window.MG || {};

    MG.decimalNumberRegex = /^\d*(\.\d{1,3}){0,1}$/;
    MG.integerNumberRegex = /^\d+$/;

    MG.newRow = function(skipHeight){
        var item = MG.rowSource.clone();
        item.find('.input-position').val(MG.fixDecimal(MG.getLastRowHeight() + (skipHeight ? 0 : MG.getLayerHeight())));
        item.find('.input-time').val(MG.getLastRowTime());
        item.appendTo(MG.rows);
    };

    MG.getLayerHeight = function() {
        return ($('#layer-height').val() || 0.05) - 0;        
    }

    MG.getLastRowHeight = function() {
        return (MG.rows.find('div.row:last-child .input-position').val() || 0) - 0;        
    }

    MG.getLastRowTime = function() {
        return (MG.rows.find('div.row:last-child .input-time').val() || 0) - 0;        
    }

    MG.fixDecimalField = function(field) {
        field.val(MG.fixDecimal(field.val()));
    };

    MG.fixDecimal = function(value) {
        return parseFloat(value).toFixed(3);
    };

    MG.generate = function(data, layerHeight){
        var result = [];

        result.push("$$HEADERSTART");
        result.push("$$ASCII");
        result.push("$$VERSION/100");
        result.push("$$UNITS/0.001");
		//result.push("$$UNITS/" + MG.fixDecimal(layerHeight / 1000.0));
        result.push("$$LABEL/1,Delay MF");
        result.push("$$DATE/123456");
        result.push("$$HEADEREND");
        result.push("$$GEOMETRYSTART");

        var item, next, i, steps, diff, step, printIndex, calculatedPosition, calculatedTime, roundedTime, cutTime, flip = false;
        for (i = 0; i < data.length; i++) {
            item = data[i];
            next = (i + 1) < data.length ? data[i+1] : data[i];

            steps = (next.position == item.position) ? 1 : ((next.position - item.position) / layerHeight) - 0;

            diff = next.time - item.time;

            console.log("From: " + item.position + ", To: " + next.position +", Steps: " + steps + ", Diff: " + diff);

            calculatedPosition = item.position;
            calculatedTime = item.time;
            for (step = 0; step < steps; step++) {
                roundedTime = Math.floor(calculatedTime);
                if (roundedTime > 0) {
                    // Write Layer
                    roundedTime = Math.floor(calculatedTime);
                    console.log("Layer: " + calculatedPosition + ", Time: " + roundedTime);

                    result.push("$$LAYER/" + calculatedPosition);

					printIndex = 0;
					//flip = false;
                    while (roundedTime > 0) {
                        if (roundedTime > 60) {
                            cutTime = 60;
                            roundedTime -= 60;                            
                        } else {
                            cutTime = roundedTime;
                            roundedTime = 0; 
                        }
                        //if (!flip) {
                            result.push("$$POLYLINE/1,2,2,0,"+(printIndex)+","+cutTime+"000,"+(printIndex));
                        //} else {
                        //    result.push("$$POLYLINE/1,2,2,0,"+(printIndex)+","+cutTime+"000,"+(printIndex));
                        //}
						printIndex++;
                        //flip = !flip;
                    }

                }
                calculatedTime += (diff / steps);
                calculatedPosition += layerHeight; 
            }

            result.push('$$GEOMETRYEND');

            $('#output').val(result.join('\n'));
        }

    };

    MG.fixPosition = function(field) {
        var layerHeight = Math.floor(MG.getLayerHeight() * 1000);
        var currentHeight = Math.floor(field.val() * 1000);
        var dif = currentHeight % layerHeight;
        if (dif == 0) {

        } else {
            if (dif > (layerHeight / 2.0)){
                currentHeight = (currentHeight - dif + layerHeight);
            } else {
                currentHeight = (currentHeight - dif);
            }
            field.val(MG.fixDecimal(currentHeight / 1000.0));
        }
    }

    $(function(){
        MG.rowSource = $('#row-source > div.row');
        MG.rows = $('#rows');

        MG.rows.on('click', '.row-remove', function(){
            var ref = $(this), item = ref.parents('.row');
            item.remove();
        });

        $('#sort').click(function(){
            
            var data = [];
            var rows = [];
            var i;

            MG.rows.find('.row').each(function(){
                var ref = $(this), position = ref.find('.input-position').val() - 0, time = ref.find('.input-time').val() - 0;
                rows.push(ref);
                data.push({position: position, time: time});
            });

            data.sort(function(a, b){return a.position - b.position});

            for (i = 0; i < data.length; i++) {
                var row = rows[i], item = data[i];
                row.find('.input-position').val(MG.fixDecimal(item.position));
                row.find('.input-time').val(item.time);
            }

        });

        $('#generate').click(function(){
            
            var data = [];
            var i;

            MG.rows.find('.row').each(function(){
                var ref = $(this), position = ref.find('.input-position').val() - 0, time = ref.find('.input-time').val() - 0;
                data.push({position: Math.floor(position * 1000), time: time});
            });

            // Make sure the data is correct before sending it off
            data.sort(function(a, b){return a.position - b.position});

            MG.generate(data, Math.floor((MG.getLayerHeight() * 1000)));
        });

        $('main').on('change', 'input.integer-check', function(){
            var ref = $(this), v = ref.val() || '0';
            if (v.match(MG.integerNumberRegex)) {

            } else {
                ref.val("0");
            }
        });

        $('main').on('change', 'input.decimal-check', function(){
            var ref = $(this), v = ref.val() || '0';
            if (v.match(MG.decimalNumberRegex)) {
                MG.fixDecimalField(ref);
                if (ref.hasClass('layer-check')) {
                    MG.fixPosition(ref);
                }
            } else {
                ref.val("0.000");
            }
        });

        $('#newLayer').click(function(){
            MG.newRow();
        });

        MG.newRow(true);
    });

}());