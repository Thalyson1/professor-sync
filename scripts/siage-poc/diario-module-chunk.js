"use strict";
(self["webpackChunkprofessor_client"] = self["webpackChunkprofessor_client"] || []).push([["src_app_modules_diario_diario_module_ts"],{

/***/ 92273:
/*!*************************************************!*\
  !*** ./src/app/modules/diario/diario.module.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DiarioModule": function() { return /* binding */ DiarioModule; }
/* harmony export */ });
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/common */ 54364);
/* harmony import */ var _pages_diario_diario_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./pages/diario/diario.component */ 7065);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/router */ 71258);
/* harmony import */ var _diario_routing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./diario.routing */ 50270);
/* harmony import */ var _core_core_module__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../core/core.module */ 40294);
/* harmony import */ var src_app_shared_shared_module__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/shared.module */ 44466);
/* harmony import */ var _pages_diario_index_component__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./pages/diario-index.component */ 13546);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/core */ 2316);











class DiarioModule {
}
DiarioModule.ɵfac = function DiarioModule_Factory(t) { return new (t || DiarioModule)(); };
DiarioModule.ɵmod = /*@__PURE__*/ _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdefineNgModule"]({ type: DiarioModule });
DiarioModule.ɵinj = /*@__PURE__*/ _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdefineInjector"]({ imports: [[
            _angular_common__WEBPACK_IMPORTED_MODULE_6__.CommonModule,
            _angular_router__WEBPACK_IMPORTED_MODULE_7__.RouterModule.forChild(_diario_routing__WEBPACK_IMPORTED_MODULE_1__.DIARIO_ROUTES),
            _core_core_module__WEBPACK_IMPORTED_MODULE_2__.CoreModule.forRoot(),
            src_app_shared_shared_module__WEBPACK_IMPORTED_MODULE_3__.SharedModule.forRoot(),
        ]] });
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵsetNgModuleScope"](DiarioModule, { declarations: [_pages_diario_diario_component__WEBPACK_IMPORTED_MODULE_0__.DiarioComponent,
        _pages_diario_index_component__WEBPACK_IMPORTED_MODULE_4__.DiarioIndexComponent], imports: [_angular_common__WEBPACK_IMPORTED_MODULE_6__.CommonModule, _angular_router__WEBPACK_IMPORTED_MODULE_7__.RouterModule, _core_core_module__WEBPACK_IMPORTED_MODULE_2__.CoreModule, src_app_shared_shared_module__WEBPACK_IMPORTED_MODULE_3__.SharedModule] }); })();


/***/ }),

/***/ 50270:
/*!**************************************************!*\
  !*** ./src/app/modules/diario/diario.routing.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DIARIO_ROUTES": function() { return /* binding */ DIARIO_ROUTES; }
/* harmony export */ });
/* harmony import */ var _core_guards_auth_guard__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @core/guards/auth.guard */ 27574);
/* harmony import */ var _core_guards_control_access_guard__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @core/guards/control-access.guard */ 38480);
/* harmony import */ var _pages_diario_index_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./pages/diario-index.component */ 13546);
/* harmony import */ var _pages_diario_diario_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./pages/diario/diario.component */ 7065);




const DIARIO_ROUTES = [
    {
        path: '',
        component: _pages_diario_index_component__WEBPACK_IMPORTED_MODULE_2__.DiarioIndexComponent,
        canActivate: [_core_guards_auth_guard__WEBPACK_IMPORTED_MODULE_0__.AuthGuard, _core_guards_control_access_guard__WEBPACK_IMPORTED_MODULE_1__.ControlAccessGuard],
        data: { breadcrumb: null },
        children: [
            {
                path: '',
                data: { title: '', breadcrumb: null },
                component: _pages_diario_diario_component__WEBPACK_IMPORTED_MODULE_3__.DiarioComponent,
            },
            {
                path: 'minhas-turmas',
                data: { title: 'Visualizar Minhas Turmas', breadcrumb: null },
                loadChildren: () => Promise.all(/*! import() */[__webpack_require__.e("default-node_modules_ng-bootstrap_ng-bootstrap___ivy_ngcc___fesm2015_ng-bootstrap_js-src_app_-5a0330"), __webpack_require__.e("default-src_app_core_services_diario-classe-frequencia_service_ts-src_app_shared_components_g-3f5ccc"), __webpack_require__.e("src_app_modules_diario_pages_minhas-turmas_minhas-turmas_module_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ../diario/pages/minhas-turmas/minhas-turmas.module */ 39631)).then((m) => m.MinhasTurmasModule),
            },
            {
                path: 'unidade-tematica',
                data: { title: 'Unidade Temática', breadcrumb: 'Unidade Temática' },
                loadChildren: () => Promise.all(/*! import() */[__webpack_require__.e("default-node_modules_ng-bootstrap_ng-bootstrap___ivy_ngcc___fesm2015_ng-bootstrap_js-src_app_-5a0330"), __webpack_require__.e("default-src_app_modules_diario_diario-shared_module_ts"), __webpack_require__.e("src_app_modules_diario_pages_unidade-tematica_unidade-tematica_module_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ../diario/pages/unidade-tematica/unidade-tematica.module */ 64757)).then((m) => m.UnidadeTematicaModule),
            },
            {
                path: 'plano-ensino',
                data: { title: 'Plano de Ensino', breadcrumb: 'Plano de Ensino' },
                loadChildren: () => Promise.all(/*! import() */[__webpack_require__.e("default-node_modules_ng-bootstrap_ng-bootstrap___ivy_ngcc___fesm2015_ng-bootstrap_js-src_app_-5a0330"), __webpack_require__.e("default-src_app_modules_diario_diario-shared_module_ts"), __webpack_require__.e("src_app_modules_diario_pages_plano-ensino_plano-ensino_module_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ../diario/pages/plano-ensino/plano-ensino.module */ 86970)).then((m) => m.PlanoEnsinoModule),
            },
        ],
    },
];


/***/ }),

/***/ 13546:
/*!****************************************************************!*\
  !*** ./src/app/modules/diario/pages/diario-index.component.ts ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DiarioIndexComponent": function() { return /* binding */ DiarioIndexComponent; }
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 2316);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ 71258);


class DiarioIndexComponent {
}
DiarioIndexComponent.ɵfac = function DiarioIndexComponent_Factory(t) { return new (t || DiarioIndexComponent)(); };
DiarioIndexComponent.ɵcmp = /*@__PURE__*/ _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({ type: DiarioIndexComponent, selectors: [["app-diario-index"]], decls: 1, vars: 0, template: function DiarioIndexComponent_Template(rf, ctx) { if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "router-outlet");
    } }, directives: [_angular_router__WEBPACK_IMPORTED_MODULE_1__.RouterOutlet], encapsulation: 2 });


/***/ }),

/***/ 7065:
/*!*****************************************************************!*\
  !*** ./src/app/modules/diario/pages/diario/diario.component.ts ***!
  \*****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DiarioComponent": function() { return /* binding */ DiarioComponent; }
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! tslib */ 3786);
/* harmony import */ var src_app_shared_utils_util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/utils/util */ 71160);
/* harmony import */ var subsink__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! subsink */ 54408);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/core */ 2316);
/* harmony import */ var _core_services_profissional_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @core/services/profissional.service */ 38287);
/* harmony import */ var _core_services_storage_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @core/services/storage.service */ 22323);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/router */ 71258);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/common */ 54364);








function DiarioComponent_ng_container_2_div_1_Template(rf, ctx) { if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "div", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](1, "div", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](2, "p", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](4, "div");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](5, "a", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](6, "Acessar");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
} if (rf & 2) {
    const rota_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵnextContext"]().$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", rota_r1.data.title || rota_r1.data.breadcrumb, " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("routerLink", rota_r1.path);
} }
function DiarioComponent_ng_container_2_Template(rf, ctx) { if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementContainerStart"](0, 3);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](1, DiarioComponent_ng_container_2_div_1_Template, 7, 2, "div", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementContainerEnd"]();
} if (rf & 2) {
    const rota_r1 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", rota_r1.path);
} }
class DiarioComponent {
    constructor(profissionalService, storageService, router) {
        this.profissionalService = profissionalService;
        this.storageService = storageService;
        this.router = router;
        this.sub = new subsink__WEBPACK_IMPORTED_MODULE_1__.SubSink();
        this.routes = [];
    }
    ngOnInit() {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__awaiter)(this, void 0, void 0, function* () {
            const { DIARIO_ROUTES } = yield Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ../../diario.routing */ 50270));
            this.routes = src_app_shared_utils_util__WEBPACK_IMPORTED_MODULE_0__.Util.sortRoutes(DIARIO_ROUTES[0].children);
            this.dadosPessoaisProfessor = this.storageService.getFromLocalStorage('dadosPessoaisProfessor', true);
            this.getByFilter();
        });
    }
    ngOnDestroy() {
        this.sub.unsubscribe();
    }
    get sortedRoutes() {
        return src_app_shared_utils_util__WEBPACK_IMPORTED_MODULE_0__.Util.sortRoutes(this.routes);
    }
    getByFilter() {
        this.sub.sink = this.profissionalService.getProfissionalWithMunicipio().subscribe(resp => this.professor = resp);
    }
}
DiarioComponent.ɵfac = function DiarioComponent_Factory(t) { return new (t || DiarioComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_core_services_profissional_service__WEBPACK_IMPORTED_MODULE_2__.ProfissionalService), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_core_services_storage_service__WEBPACK_IMPORTED_MODULE_3__.StorageService), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_6__.Router)); };
DiarioComponent.ɵcmp = /*@__PURE__*/ _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdefineComponent"]({ type: DiarioComponent, selectors: [["app-diario"]], decls: 3, vars: 1, consts: [["id", "container-cards-diario", 1, "container"], [1, "row"], ["id", "container-rotas", 4, "ngFor", "ngForOf"], ["id", "container-rotas"], ["class", "col-sm-6 col-md-4", 4, "ngIf"], [1, "col-sm-6", "col-md-4"], ["id", "card", 1, "card", "p-3"], [1, "card-info-title"], ["id", "btn-acessar", 1, "btn", "rounded-pill", "btn-primary", "col-auto", "d-inline", "float-right", 3, "routerLink"]], template: function DiarioComponent_Template(rf, ctx) { if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "div", 0);
        _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](1, "div", 1);
        _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](2, DiarioComponent_ng_container_2_Template, 2, 1, "ng-container", 2);
        _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
        _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    } if (rf & 2) {
        _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](2);
        _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngForOf", ctx.sortedRoutes);
    } }, directives: [_angular_common__WEBPACK_IMPORTED_MODULE_7__.NgForOf, _angular_common__WEBPACK_IMPORTED_MODULE_7__.NgIf, _angular_router__WEBPACK_IMPORTED_MODULE_6__.RouterLinkWithHref], encapsulation: 2 });


/***/ })

}]);
//# sourceMappingURL=src_app_modules_diario_diario_module_ts-es2015.js.map