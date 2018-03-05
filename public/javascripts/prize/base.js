var lineNum = 20;

var camera, scene, renderer;
var controls;

var table = _prize_users_;

var objects = [];
var targets = { table: [], sphere: [], helix: [], grid: [], grid10: [] };
var showType = 'sphere';

init();
var chouj = new Chouj([table, objects], {frequency: 6, delay: 1.5, lineNum: lineNum});
window.onload = function(){
	animate();
}

function init() {

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 2000 );
	camera.position.z = 3860;

	scene = new THREE.Scene();

	// table
	for ( var i = 0; i < table.length; i++ ) {
		var item = table[i];

		var element = document.createElement( 'div' );
		element.id = 'ele'+ i;
		element.className = 'element';
		element.style.backgroundColor = 'rgba(0,127,127,0.8)';

		var number = document.createElement( 'div' );
		number.className = 'number';
		number.textContent = i;
		element.appendChild( number );

		var symbol = document.createElement( 'img' );
		symbol.className = 'symbol';
		symbol.src = item.avatar;
		element.appendChild( symbol );

		var details = document.createElement( 'div' );
		details.className = 'details';
		details.innerHTML = item.name;
		element.appendChild( details );

		var object = new THREE.CSS3DObject( element );
		object.position.x = Math.random() * 4000 - 2000;
		object.position.y = Math.random() * 4000 - 2000;
		object.position.z = Math.random() * 4000 - 2000;
		scene.add( object );

		object.__id__ = i;
		objects.push( object );

		// 渲染table格式
		var xNum = parseInt( i ) % lineNum + 1; //列
		var yNum = parseInt( i / lineNum ) + 1; //行

		var object = new THREE.Object3D();
		object.position.x = ( xNum * 360 ) - 3760;
		object.position.y = - ( yNum * 420 ) + 2100;

		targets.table.push( object );

	}

	// sphere
	var vector = new THREE.Vector3();
	var spherical = new THREE.Spherical();

	for ( var i = 0, l = objects.length; i < l; i ++ ) {

		var phi = Math.acos( -1 + ( 2 * i ) / l );
		var theta = Math.sqrt( l * Math.PI ) * phi;

		var object = new THREE.Object3D();

		spherical.set( 1600, phi, theta );

		object.position.setFromSpherical( spherical );

		vector.copy( object.position ).multiplyScalar( 2 );

		object.lookAt( vector );

		targets.sphere.push( object );

	}

	// helix
	var vector = new THREE.Vector3();
	var cylindrical = new THREE.Cylindrical();

	for ( var i = 0, l = objects.length; i < l; i ++ ) {

		var theta = i * 0.175 + Math.PI;
		var y = - ( i * 11 ) + 900;

		var object = new THREE.Object3D();

		cylindrical.set( 1500, theta, y );

		object.position.setFromCylindrical( cylindrical );

		vector.x = object.position.x * 2;
		vector.y = object.position.y;
		vector.z = object.position.z * 2;

		object.lookAt( vector );

		targets.helix.push( object );

	}

	// grid
	for ( var i = 0; i < objects.length; i ++ ) {

		var object = new THREE.Object3D();

		object.position.x = ( ( i % 5) * 420 ) - 800;
		object.position.y = ( - ( Math.floor( i / 5 ) % 4 ) * 450 ) + 600;
		object.position.z = -( Math.floor( i / 20 ) ) * 10 + 1900;

		targets.grid.push( object );

	}

	// grid-10
	for ( var i = 0; i < objects.length; i ++ ) {

		var object = new THREE.Object3D();

		object.position.x = ( ( i % 5) * 420 ) - 800;
		object.position.y = ( - ( Math.floor( i / 5 ) % 2 ) * 450 ) + 200;
		object.position.z = -( Math.floor( i / 10 ) ) * 10 + 2600;

		targets.grid10.push( object );

	}
	//
	renderer = new THREE.CSS3DRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.style.position = 'absolute';
	document.getElementById( 'container' ).appendChild( renderer.domElement );

	//
	controls = new THREE.TrackballControls( camera, renderer.domElement );
	controls.rotateSpeed = 0.5;
	controls.minDistance = 500;
	controls.maxDistance = 6000;
	controls.addEventListener( 'change', render );


	// 绑定服务器事件
	var cmds = [];
	function exec_cmd(type, params) {
		cmds.push([type, params]);
		if (showType != 'table') {
			showType = 'table';
			controls_reset();
			chouj.randomSort();
			transform( targets.table, 2000, run_cmds);
		}
		else {
			run_cmds();
		}
	}
	function run_cmds() {
		var cmd;
		while (cmds.length > 0){
			cmd = cmds.shift();
			console.log(cmd);
			switch (cmd[0]) {
				case 'start':
					chouj.nextRound(cmd[1].round % 100);
					chouj.start();
					break;
				case 'stop':
					chouj.nextRound(cmd[1].round % 100);
					chouj.ani_callback = run_cmds;
					chouj.stop(false, cmd[1].uid);
					return;
				case 'batch':
					chouj.nextRound(cmd[1].round % 100);
					chouj.ani_callback = run_cmds;
					chouj.batch(2000, cmd[1].uids);
					return;
			}
		}
		jQuery.ajax('/prize/done');
		console.log('done');
	}

	// 批量开始
	socket.on('_server_push_/prize_m_take', function(err, data) {
		exec_cmd('batch', data);
	});

	// 单个开始
	socket.on('_server_push_/prize_s_start', function(err, data) {
		exec_cmd('start', data);
	});

	// 单个结束
	socket.on('_server_push_/prize_s_stop', function(err, data) {
		exec_cmd('stop', data);
	});


	// 切换到表格界面
	var button = document.getElementById( 'table' );
	button.addEventListener( 'click', function ( event ) {

		showType = 'table';
		setTimeout(function(){
			controls.reset();
			chouj.randomSort();
			transform( targets.table, 2000 );//默认：2000
		}, 500)

	}, false );

	// 切换到球形界面
	var button = document.getElementById( 'sphere' );
	button.addEventListener( 'click', function ( event ) {

		showType = 'sphere';
		// controls.reset();
		chouj.randomSort();
		transform( targets.sphere, 2000 );

	}, false );

	// 切换到圆柱形界面
	var button = document.getElementById( 'helix' );
	button.addEventListener( 'click', function ( event ) {

		showType = 'helix';
		// controls.reset();
		chouj.randomSort();
		transform( targets.helix, 2000 );

	}, false );

	// 切换到堆叠界面
	var button = document.getElementById( 'grid' );
	button.addEventListener( 'click', function ( event ) {
		// showType = 'grid';
		controls.reset();
		if (chouj.batch(2000) !== false) {
			document.getElementById('menu').style.display = 'none';
		}

	}, false );


	// 监听窗口大小变化
	window.addEventListener( 'resize', onWindowResize, false );

	// 抽奖按钮
	var button = document.getElementById( 'begin' );
	button.addEventListener( 'click', function ( event ) {

		chouj.start(10);

	}, false );

	// 停止抽奖动画, 显示抽奖结果
	var button = document.getElementById( 'end' );
	button.addEventListener( 'click', function ( event ) {

		chouj.stop();

	}, false);

	// 连续抽单抽3个
	var button = document.getElementById( 'run30' );
	button.addEventListener( 'click', function ( event ) {

		chouj.run(3);

	}, false);

	// 关闭中奖记录页面
	var button = document.querySelector('.result-close');
	button.addEventListener( 'click', function ( event ) {

		document.querySelector('.result').style.display = 'none';

	}, false);

	// 展示中奖记录
	var button = document.getElementById('result-open');
	button.addEventListener( 'click', function ( event ) {


		document.getElementById('result-content').innerHTML = chouj.getResult();
		document.querySelector('.result').style.display = 'block';

	}, false);


	// 下一轮快捷操作
	var button = document.getElementById('next');
	button.addEventListener( 'click', function ( event ) {

		chouj.nextRound();
		select.selectedIndex = chouj.round-1;

	}, false);

	// 修改当前为第几轮抽奖
	var select = document.getElementById('round');
	select.addEventListener('change', function( evt ){

		var index = this.selectedIndex + 1;
		chouj.nextRound(index);

	}, false);

	// 重置抽奖记录
	var button = document.getElementById('reset');
	button.addEventListener( 'click', function ( event ) {

		if (confirm('确定要重置所有的抽奖纪录么？') == true) {
			chouj.resetHistory();
			select.selectedIndex = chouj.round-1;
		}

	}, false);

	transform( targets[showType], 2000 , afterInit );//默认：5000
}

function afterInit(){
	//document.getElementById('menu').style.display = 'block';
}

function transform( targets, duration, func , type = TWEEN.Easing.Exponential.InOut) {
	TWEEN.removeAll();

	if (showType === 'helix' || showType === 'sphere') {
		controls_run();
	}

	setTimeout(function(){
		for ( var i = 0; i < objects.length; i++ ) {
			var object = objects[ i ];
			var target = targets[ i ];

			new TWEEN.Tween( object.position )
				.to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
				.easing( type )
				.start();

			new TWEEN.Tween( object.rotation )
				.to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
				.easing( type )
				.start();
		}

		new TWEEN.Tween( this )
			.to( {}, duration * 2 )
			.onUpdate( render )
			.start()
			.onComplete( function(){
				if (typeof func == 'function') {
					func();
				}

			});

	}, 10)
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	render();

}

function controls_reset() {

	if (_ctrls_id) {
		cancelAnimationFrame(_ctrls_id);
	}
	controls.reset();
}

var _ctrls_id;
function controls_run() {
	_ctrls_id = requestAnimationFrame( controls_run );
	controls.update();
}

function animate() {
	requestAnimationFrame( animate );
	TWEEN.update();
}


function render() {

	renderer.render( scene, camera );

}
